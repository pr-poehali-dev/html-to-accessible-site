import base64
import hashlib
import hmac
import json
import time


def _b64url_decode(data: str) -> bytes:
    padding = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')


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
