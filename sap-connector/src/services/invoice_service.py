"""
Serviço para gerenciar faturas
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from src.database.supabase_client import get_supabase
from src.schemas.invoice_schemas import InvoiceCreate, InvoiceUpdate, InvoiceBulkRequest

logger = logging.getLogger(__name__)

class InvoiceService:
    @staticmethod
    async def save_invoices(invoice_data: InvoiceBulkRequest) -> Dict[str, Any]:
        """
        Salva múltiplas faturas no banco de dados
        
        Args:
            invoice_data: Dados das faturas a serem salvas
            
        Returns:
            Resultado da operação com estatísticas de processamento
        """
        try:
            supabase = get_supabase()
            start_time = datetime.now()
            
            invoices_to_process = [invoice.dict() for invoice in invoice_data.invoices]
            batch_size = 100
            batches = []
            
            # Divide em lotes para processar
            for i in range(0, len(invoices_to_process), batch_size):
                batches.append(invoices_to_process[i:i+batch_size])
            
            logger.info(f"Processando {len(invoices_to_process)} faturas em {len(batches)} lotes")
            
            total_processed = 0
            errors = []
            
            # Processa cada lote
            for i, batch in enumerate(batches):
                batch_start_time = datetime.now()
                try:
                    result = supabase.table('faturas').upsert(
                        batch, 
                        on_conflict='fat_id', 
                        returning='minimal'
                    ).execute()
                    
                    total_processed += len(batch)
                    batch_time = (datetime.now() - batch_start_time).total_seconds()
                    logger.info(f"Lote {i+1}/{len(batches)} processado: {len(batch)} faturas em {batch_time:.2f}s")
                except Exception as e:
                    logger.error(f"Erro no lote {i+1}: {str(e)}")
                    errors.append({"batch": i+1, "error": str(e)})
                    
                    # Tenta processar cada fatura individualmente
                    logger.info(f"Processando lote {i+1} individualmente...")
                    for j, invoice in enumerate(batch):
                        try:
                            supabase.table('faturas').upsert(
                                [invoice], 
                                on_conflict='fat_id', 
                                returning='minimal'
                            ).execute()
                            
                            total_processed += 1
                        except Exception as e_ind:
                            logger.error(f"Erro na fatura {invoice.get('fat_id', j)}: {str(e_ind)}")
                            errors.append({
                                "fatId": invoice.get('fat_id', f'unknown-{j}'),
                                "error": str(e_ind)
                            })
            
            total_time = (datetime.now() - start_time).total_seconds()
            
            result = {
                "success": len(errors) == 0,
                "processed": total_processed,
                "errors": len(errors),
                "error_details": errors[:10] if errors else None,
                "total_time": total_time
            }
            
            logger.info(
                f"Processamento de faturas concluído em {total_time:.2f}s: "
                f"{total_processed} processadas com sucesso, {len(errors)} erros."
            )
            
            return result
        
        except Exception as e:
            logger.error(f"Erro crítico ao salvar faturas: {str(e)}")
            return {
                "success": False,
                "processed": 0,
                "errors": 1,
                "error": str(e)
            }
    
    @staticmethod
    async def update_invoice_status(invoice_ids: List[str]) -> Dict[str, Any]:
        """
        Atualiza o status de faturas com base em suas datas de vencimento
        
        Args:
            invoice_ids: Lista de IDs das faturas para atualizar
            
        Returns:
            Resultado da operação
        """
        try:
            supabase = get_supabase()
            today = datetime.now().date().isoformat()
            
            if not invoice_ids:
                return {"success": True, "message": "Nenhuma fatura para atualizar", "updated": 0}
            
            # Busca as faturas existentes
            result = supabase.table('faturas').select('fat_id, status_id, dt_vencimento').in_('fat_id', invoice_ids).execute()
            
            if not result.data:
                return {"success": True, "message": "Nenhuma fatura encontrada", "updated": 0}
            
            # Identifica quais faturas precisam ser atualizadas
            faturas_para_atualizar = []
            for fatura in result.data:
                dt_vencimento = fatura.get('dt_vencimento')
                status_id = fatura.get('status_id')
                
                if dt_vencimento and status_id == 1 and dt_vencimento < today:
                    faturas_para_atualizar.append({
                        "fat_id": fatura["fat_id"],
                        "status_id": 2  # Muda para status vencido
                    })
            
            # Atualiza as faturas que precisam ser atualizadas
            if faturas_para_atualizar:
                supabase.table('faturas').upsert(
                    faturas_para_atualizar,
                    on_conflict='fat_id'
                ).execute()
                
                logger.info(f"Atualizados status de {len(faturas_para_atualizar)} faturas")
                return {
                    "success": True,
                    "message": f"{len(faturas_para_atualizar)} faturas atualizadas",
                    "updated": len(faturas_para_atualizar)
                }
            else:
                return {
                    "success": True,
                    "message": "Nenhuma fatura precisou ser atualizada",
                    "updated": 0
                }
                
        except Exception as e:
            logger.error(f"Erro ao atualizar status de faturas: {str(e)}")
            return {
                "success": False,
                "message": f"Erro ao atualizar status: {str(e)}",
                "updated": 0,
                "error": str(e)
            }
    
    @staticmethod
    async def update_invoice_details(invoice_id: str, update_data: InvoiceUpdate) -> Dict[str, Any]:
        """
        Atualiza detalhes de uma fatura específica
        
        Args:
            invoice_id: ID da fatura
            update_data: Dados a serem atualizados
            
        Returns:
            Resultado da operação
        """
        try:
            supabase = get_supabase()
            
            # Busca a fatura para validar que existe
            fatura_result = supabase.table('faturas').select('id').eq('fat_id', invoice_id).single().execute()
            
            if not fatura_result.data:
                return {
                    "success": False,
                    "message": f"Fatura {invoice_id} não encontrada"
                }
            
            # Converte para dicionário e remove valores None, mantendo zeros e strings vazias
            update_dict = {}
            for k, v in update_data.dict().items():
                if v is not None:  # Mantém zeros e strings vazias, remove apenas None
                    update_dict[k] = v
            
            if not update_dict:
                return {
                    "success": True,
                    "message": "Nenhum dado para atualizar"
                }
            
            # Atualiza a fatura
            supabase.table('faturas').update(update_dict).eq('fat_id', invoice_id).execute()
            
            logger.info(f"Fatura {invoice_id} atualizada com sucesso")
            return {
                "success": True,
                "message": f"Fatura {invoice_id} atualizada com sucesso"
            }
            
        except Exception as e:
            logger.error(f"Erro ao atualizar detalhes da fatura {invoice_id}: {str(e)}")
            return {
                "success": False,
                "message": f"Erro ao atualizar fatura: {str(e)}",
                "error": str(e)
            }
    
    @staticmethod
    async def update_customer_cnpj(invoice_id: str, cnpj: str) -> Dict[str, Any]:
        """
        Atualiza o CNPJ do cliente associado a uma fatura
        
        Args:
            invoice_id: ID da fatura
            cnpj: CNPJ do cliente
            
        Returns:
            Resultado da operação
        """
        try:
            supabase = get_supabase()
            
            if not cnpj or len(cnpj) < 14:
                return {
                    "success": False,
                    "message": "CNPJ inválido"
                }
            
            # Busca a fatura para obter o cliente_id
            fatura_result = supabase.table('faturas').select('customer_id').eq('fat_id', invoice_id).single().execute()
            
            if not fatura_result.data or not fatura_result.data.get('customer_id'):
                return {
                    "success": False,
                    "message": f"Fatura {invoice_id} não encontrada ou sem cliente associado"
                }
            
            customer_id = fatura_result.data['customer_id']
            
            # Atualiza o CNPJ do cliente
            supabase.table('customer').update({
                'costumer_cnpj': cnpj
            }).eq('id', customer_id).execute()
            
            logger.info(f"CNPJ do cliente {customer_id} atualizado com sucesso")
            return {
                "success": True,
                "message": f"CNPJ do cliente atualizado com sucesso"
            }
            
        except Exception as e:
            logger.error(f"Erro ao atualizar CNPJ do cliente para fatura {invoice_id}: {str(e)}")
            return {
                "success": False,
                "message": f"Erro ao atualizar CNPJ: {str(e)}",
                "error": str(e)
            }

# Instância global do serviço
invoice_service = InvoiceService()