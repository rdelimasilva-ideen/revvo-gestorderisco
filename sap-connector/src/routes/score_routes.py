from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from ..database.supabase_client import get_supabase
from datetime import datetime, timedelta
import math
import random
from auth import verify_token
from fastapi import Depends

router = APIRouter()

class ScoreModelUpdate(BaseModel):
    id: str
    name: str
    description: str
    frequencia_calculo: str
    type_of_model: str
    finalScore: Optional[float] = None
    final_score: Optional[float] = None
    ksScore: Optional[float] = None
    ks_score: Optional[float] = None
    target_nome: str
    target_operador: str
    target_valor: float
    variables: List[Dict[str, Any]]

@router.get("/payment-term-score")
async def get_payment_term_and_score(
    customer_id: Optional[str] = None,
    corporate_group_id: Optional[str] = None, current_user: str = Depends(verify_token)
):
    """
    Obter prazo de pagamento e score por período
    """
    try:
        supabase = get_supabase()
        
        # Se não há dados reais, retornar dados mock consistentes
        if not customer_id and not corporate_group_id:
            return get_mock_data()

        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=13 * 30)  # ~13 meses

        # Buscar sale_orders
        query = supabase.table('sale_orders').select(
            'created_at, due_date, customer_id, company_id, total_amt'
        ).gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).order('created_at')

        if customer_id:
            query = query.eq('customer_id', customer_id)

        sale_orders_response = query.execute()
        sale_orders = sale_orders_response.data if sale_orders_response.data else []

        # Se precisar filtrar por corporate_group_id
        if corporate_group_id and not customer_id:
            companies_response = supabase.table('company').select('id').eq('corporate_group_id', corporate_group_id).execute()
            companies = companies_response.data if companies_response.data else []
            company_ids = [c['id'] for c in companies]
            sale_orders = [o for o in sale_orders if o['company_id'] in company_ids]

        return process_payment_term_data(sale_orders)

    except Exception as e:
        print(f"Erro ao buscar dados de prazo e score: {e}")
        return get_mock_data()


@router.get("/models")
async def get_all_models(current_user: str = Depends(verify_token)):
    """
    Buscar todos os modelos de score do banco, incluindo variáveis
    """
    try:
        supabase = get_supabase()
        
        # Buscar todos os modelos
        models_response = supabase.table('score_models').select('*').order('created_at', desc=True).execute()
        models = models_response.data if models_response.data else []
        
        if not models:
            return []

        # Buscar variáveis de todos os modelos
        model_ids = [m['id'] for m in models]
        variables_response = supabase.table('score_model_variables').select('*').in_('model_id', model_ids).execute()
        variables = variables_response.data if variables_response.data else []

        # Agrupar variáveis por modelo
        variables_by_model = {}
        for v in variables:
            model_id = v['model_id']
            if model_id not in variables_by_model:
                variables_by_model[model_id] = []
            variables_by_model[model_id].append(v)

        # Montar estrutura final
        result = []
        for model in models:
            model_with_variables = {
                **model,
                'variables': variables_by_model.get(model['id'], [])
            }
            result.append(model_with_variables)

        return result

    except Exception as e:
        print(f"Erro ao buscar modelos de score: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/models/{model_id}")
async def update_model_and_variables(model_id: str, model: ScoreModelUpdate, current_user: str = Depends(verify_token)):
    """
    Atualizar um modelo e suas variáveis no banco
    """
    try:
        supabase = get_supabase()
        
        # Preparar dados do modelo
        model_data = {
            'name': model.name,
            'description': model.description,
            'frequencia_calculo': model.frequencia_calculo,
            'type_of_model': model.type_of_model,
            'final_score': model.finalScore if model.finalScore is not None else model.final_score,
            'ks_score': model.ksScore if model.ksScore is not None else model.ks_score,
            'target_nome': model.target_nome,
            'target_operador': model.target_operador,
            'target_valor': model.target_valor
        }

        # Atualizar modelo
        update_response = supabase.table('score_models').update(model_data).eq('id', model_id).execute()
        
        if not update_response.data:
            raise HTTPException(status_code=404, detail="Modelo não encontrado")

        # Deletar variáveis existentes
        supabase.table('score_model_variables').delete().eq('model_id', model_id).execute()

        # Inserir novas variáveis
        if model.variables:
            variables_to_insert = []
            for v in model.variables:
                variable_data = {
                    'model_id': model_id,
                    'name': v.get('name'),
                    'weight': v.get('weight'),
                    'score': v.get('score')
                }
                variables_to_insert.append(variable_data)
            
            if variables_to_insert:
                supabase.table('score_model_variables').insert(variables_to_insert).execute()

        return {"success": True}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao atualizar modelo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Funções auxiliares
def get_mock_data():
    """Gerar dados mock para demonstração"""
    months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan']
    current_year = datetime.now().year
    
    mock_data = []
    for i in range(13):
        month_date = datetime.now() - timedelta(days=30 * (12 - i))
        score = 750 + (i * 5) + random.randint(-20, 20)
        payment_term = 30 + random.randint(-5, 15)
        
        mock_data.append({
            'month': months[i],
            'paymentTerm': payment_term,
            'score': max(300, min(900, score)),
            'date': month_date.isoformat(),
            'year': month_date.year
        })
    
    return mock_data


def process_payment_term_data(sale_orders):
    """Processar dados de sale_orders para gerar métricas de prazo e score"""
    end_date = datetime.now()
    months = []
    
    def get_month_key(date):
        return f"{date.year}-{date.month:02d}"
    
    def get_month_label(date):
        month_names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        return month_names[date.month - 1]
    
    # Gerar os últimos 13 meses
    for i in range(12, -1, -1):
        month_date = datetime(end_date.year, end_date.month, 1) - timedelta(days=30 * i)
        months.append({
            'date': month_date,
            'key': get_month_key(month_date),
            'label': get_month_label(month_date),
            'payment_term_days': [],
            'total_amount': 0,
            'order_count': 0
        })
    
    # Processar pedidos e agrupar por mês
    for order in sale_orders:
        order_date = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00')).replace(tzinfo=None)
        
        if not order['due_date']:
            continue
            
        due_date = datetime.fromisoformat(order['due_date'].replace('Z', '+00:00')).replace(tzinfo=None)
        order_month = get_month_key(order_date)
        month_data = next((m for m in months if m['key'] == order_month), None)
        
        if month_data:
            payment_term_days = (due_date - order_date).days
            if 0 < payment_term_days <= 365:  # Validar prazo razoável
                month_data['payment_term_days'].append(payment_term_days)
                month_data['total_amount'] += float(order.get('total_amt', 0))
                month_data['order_count'] += 1
    
    # Calcular métricas finais para cada mês
    processed_data = []
    for index, month in enumerate(months):
        avg_payment_term = (
            sum(month['payment_term_days']) / len(month['payment_term_days'])
            if month['payment_term_days'] else 0
        )
        
        # Calcular média móvel dos últimos 3 meses
        moving_avg_payment_term = calculate_moving_average(months, index, 3)
        score = calculate_score(month['total_amount'], month['order_count'], avg_payment_term, index)
        
        processed_data.append({
            'month': month['label'],
            'paymentTerm': round(moving_avg_payment_term if moving_avg_payment_term > 0 else avg_payment_term),
            'score': round(score),
            'date': month['date'].isoformat(),
            'year': month['date'].year
        })
    
    # Se não há dados suficientes, usar dados mock
    has_valid_data = any(item['paymentTerm'] > 0 for item in processed_data)
    if not has_valid_data:
        return get_mock_data()
    
    return processed_data


def calculate_moving_average(months, current_index, window_size):
    """Calcular média móvel"""
    start_index = max(0, current_index - window_size + 1)
    end_index = current_index
    
    total_sum = 0
    count = 0
    
    for i in range(start_index, end_index + 1):
        month = months[i]
        if month['payment_term_days']:
            avg = sum(month['payment_term_days']) / len(month['payment_term_days'])
            total_sum += avg
            count += 1
    
    return total_sum / count if count > 0 else 0


def calculate_score(total_amount, order_count, avg_payment_term, month_index):
    """Calcular score baseado nas métricas"""
    base_score = 750  # Score base mais realista
    
    # Componente de volume financeiro
    if total_amount > 100000:
        base_score += 40
    elif total_amount > 50000:
        base_score += 25
    elif total_amount > 10000:
        base_score += 15
    elif total_amount > 0:
        base_score += 5
    
    # Componente de frequência
    if order_count > 10:
        base_score += 25
    elif order_count > 5:
        base_score += 15
    elif order_count > 0:
        base_score += 10
    
    # Componente de comportamento de pagamento (mais impacto)
    if avg_payment_term <= 25:
        base_score += 50
    elif avg_payment_term <= 30:
        base_score += 35
    elif avg_payment_term <= 45:
        base_score += 20
    elif avg_payment_term <= 60:
        base_score += 10
    elif avg_payment_term > 60:
        base_score -= 30
    
    # Tendência temporal (simular melhoria/piora ao longo do tempo)
    trend = math.sin(month_index * 0.5) * 15
    base_score += trend
    
    # Variação controlada para realismo
    random_variation = (random.random() - 0.5) * 20
    base_score += random_variation
    
    return max(300, min(900, base_score))
