import base64
import hashlib
import hmac
import json
import os
import time


def hash_password(password: str, salt: str = None) -> str:
    '''Хэширует пароль с солью (PBKDF2-HMAC-SHA256). Возвращает "salt$hash" в hex.'''
    if salt is None:
        salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100_000)
    return f"{salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    '''Проверяет пароль по сохранённому "salt$hash".'''
    try:
        salt, _ = stored.split('$', 1)
    except ValueError:
        return False
    candidate = hash_password(password, salt)
    return hmac.compare_digest(candidate, stored)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')


def _b64url_decode(data: str) -> bytes:
    padding = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_token(user_id: int, secret: str, ttl_seconds: int = 60 * 60 * 24 * 30) -> str:
    '''Создаёт подписанный токен вида header.payload.signature (HMAC-SHA256).'''
    header = {'alg': 'HS256', 'typ': 'JWT'}
    payload = {'user_id': user_id, 'exp': int(time.time()) + ttl_seconds}
    header_b64 = _b64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = _b64url_encode(json.dumps(payload).encode('utf-8'))
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def verify_token(token: str, secret: str):
    '''Проверяет токен и возвращает user_id, либо None если токен невалиден/истёк.'''
    try:
        header_b64, payload_b64, signature_b64 = token.split('.')
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
        expected_sig_b64 = _b64url_encode(expected_sig)
        if not hmac.compare_digest(expected_sig_b64, signature_b64):
            return None
        payload = json.loads(_b64url_decode(payload_b64))
        if payload.get('exp', 0) < time.time():
            return None
        return payload.get('user_id')
    except Exception:
        return None
