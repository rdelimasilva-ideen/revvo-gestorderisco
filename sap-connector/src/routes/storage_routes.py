from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
import logging
import re
import urllib.parse
from auth import verify_token
from fastapi import Depends

router = APIRouter(prefix="/api/storage", tags=["storage"])
logger = logging.getLogger(__name__)

def sanitize_storage_path(path: str) -> str:
    """
    Limpa o path do arquivo para ser compatível com Supabase Storage
    """
    # Remover caracteres especiais e acentos
    path = re.sub(r'[^\w\-_./]', '_', path)
    # Remover múltiplos underscores
    path = re.sub(r'_+', '_', path)
    # Remover underscores no início e fim
    path = path.strip('_')
    return path

@router.post("/upload")
async def upload_file(
    bucket: str = Form(...),
    path: str = Form(...),
    file: UploadFile = File(...),
    current_user: str = Depends(verify_token)
):
    """
    Upload de arquivo para o Supabase Storage
    """
    try:
        supabase = get_supabase()
        
        # Sanitizar o path para remover caracteres especiais
        clean_path = sanitize_storage_path(path)
        logger.info(f"Path original: {path}")
        logger.info(f"Path limpo: {clean_path}")
        
        # Ler o conteúdo do arquivo
        file_content = await file.read()
        logger.info(f"Tamanho do arquivo: {len(file_content)} bytes")
        
        # Upload para o Supabase Storage (API correta)
        response = supabase.storage.from_(bucket).upload(clean_path, file_content)
        
        # Log da resposta para debug
        logger.info(f"Upload response type: {type(response)}")
        logger.info(f"Upload response: {response}")
        
        # Tratar resposta httpx.Response
        if hasattr(response, 'status_code'):
            if response.status_code == 200 or response.status_code == 201:
                # Upload bem-sucedido
                try:
                    response_data = response.json() if hasattr(response, 'json') else {}
                except:
                    response_data = {"path": clean_path}
                
                return JSONResponse(content={
                    "success": True,
                    "data": response_data,
                    "path": clean_path,
                    "message": "Arquivo enviado com sucesso"
                })
            else:
                # Erro HTTP
                error_msg = response.text if hasattr(response, 'text') else f"HTTP {response.status_code}"
                raise HTTPException(status_code=response.status_code, detail=error_msg)
        
        # Verificar se houve erro na resposta (formato antigo)
        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=400, detail=str(response.error))
        
        # Verificar se a resposta é um dicionário com erro
        if isinstance(response, dict) and 'error' in response:
            raise HTTPException(status_code=400, detail=response.get('message', str(response)))
        
        # Verificar se a resposta tem dados (formato antigo)
        if hasattr(response, 'data'):
            result_data = response.data
        else:
            result_data = {"path": clean_path}
            
        return JSONResponse(content={
            "success": True,
            "data": result_data,
            "path": clean_path,
            "message": "Arquivo enviado com sucesso"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao fazer upload do arquivo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload: {str(e)}")

@router.get("/public-url/{bucket}/{path:path}")
async def get_public_url(bucket: str, path: str, current_user: str = Depends(verify_token)):
    """
    Obter URL pública de um arquivo
    """
    try:
        supabase = get_supabase()
        
        # Obter URL pública
        response = supabase.storage.from_(bucket).get_public_url(path)
        
        public_url = None
        if hasattr(response, 'data') and response.data:
            public_url = response.data.get('publicUrl')
        elif isinstance(response, dict):
            public_url = response.get('publicUrl')
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "publicUrl": public_url
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter URL pública: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter URL: {str(e)}")

@router.delete("/remove")
async def remove_file(bucket: str, path: str, current_user: str = Depends(verify_token)):
    """
    Remover arquivo do storage
    """
    try:
        supabase = get_supabase()
        
        # Remover arquivo
        response = supabase.storage.from_(bucket).remove([path])
        
        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=400, detail=response.error.message)
            
        return JSONResponse(content={
            "success": True,
            "message": "Arquivo removido com sucesso"
        })
        
    except Exception as e:
        logger.error(f"Erro ao remover arquivo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao remover arquivo: {str(e)}")

@router.get("/list/{bucket}")
async def list_files(bucket: str, path: str = "", current_user: str = Depends(verify_token)):
    """
    Listar arquivos em um bucket/pasta
    """
    try:
        supabase = get_supabase()
        
        # Listar arquivos
        response = supabase.storage.from_(bucket).list(path)
        
        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=400, detail=response.error.message)
            
        return JSONResponse(content={
            "success": True,
            "data": response.data if hasattr(response, 'data') else response
        })
        
    except Exception as e:
        logger.error(f"Erro ao listar arquivos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar arquivos: {str(e)}")
