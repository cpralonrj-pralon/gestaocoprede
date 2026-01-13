-- Execute este script no SQL Editor do Supabase para resetar as senhas

-- 1. Habilita extensão pgcrypto (necessária para gerar o hash da senha)
create extension if not exists pgcrypto;

-- 2. Reseta a senha de TODOS os usuários cadastrados no Auth para 'claro123'
-- ATENÇÃO: Isso afetará TODOS os usuários. Adicione WHERE se quiser filtrar.
UPDATE auth.users
SET encrypted_password = crypt('claro123', gen_salt('bf')),
    updated_at = now();

-- 3. Habilita a flag 'must_change_password' na tabela de perfis
-- Isso fará com que o sistema peça para trocar a senha no próximo login
UPDATE public.employees
SET must_change_password = true;

-- Verificação (opcional)
-- SELECT email, encrypted_password FROM auth.users limit 5;
-- SELECT full_name, must_change_password FROM public.employees limit 5;
