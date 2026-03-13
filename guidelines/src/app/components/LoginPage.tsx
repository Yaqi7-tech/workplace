import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (userId?: string) => void;
  title?: string;
  subtitle?: string;
}

export function LoginPage({ onLogin, title = '职场培训系统', subtitle }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // 使用 Supabase 认证
      if (isRegisterMode) {
        // 注册
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw signUpError;
        } else {
          // 注册成功，显示成功提示并切换到登录模式
          setSuccessMessage('注册成功！请登录您的账号。');
          setIsRegisterMode(false);
          setPassword(''); // 清空密码
        }
      } else {
        // 登录
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        } else {
          onLogin(data.user?.id);
        }
      }
    } catch (err) {
      console.error('登录错误:', err);
      const errorMessage = err instanceof Error ? err.message : '操作失败，请重试';

      // 友好的错误提示
      if (errorMessage.includes('Invalid login credentials')) {
        setError('邮箱或密码错误，请检查后重试');
      } else if (errorMessage.includes('User already registered')) {
        setError('该邮箱已注册，请切换到登录模式');
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('请先验证您的邮箱');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(254,254,250), rgb(254,253,249))' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-[rgb(45,45,45)] mb-2">
              {title}
            </h1>
            <p className="text-[rgb(122,122,122)]">
              {isRegisterMode ? '注册账号' : (subtitle || '登录以开始您的培训')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            {successMessage && (
              <div className="p-3 rounded-lg border-2" style={{ backgroundColor: 'rgb(176,214,169,0.3)', borderColor: 'rgb(176,214,169)' }}>
                <p className="text-sm" style={{ color: 'rgb(60,155,201)' }}>{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg border-2" style={{ backgroundColor: 'rgb(252,117,123,0.2)', borderColor: 'rgb(252,117,123)' }}>
                <p className="text-sm" style={{ color: 'rgb(249,127,95)' }}>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-white hover:opacity-90"
              style={{ backgroundColor: 'rgb(60,155,201)' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isRegisterMode ? '注册中...' : '登录中...'}
                </>
              ) : (
                isRegisterMode ? '注册' : '登录'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError('');
                setSuccessMessage('');
              }}
              className="text-sm hover:opacity-70"
              style={{ color: 'rgb(122,122,122)' }}
            >
              {isRegisterMode ? '已有账号？去登录' : '没有账号？去注册'}
            </button>
          </div>
        </div>

        <p className="text-center text-sm mt-8" style={{ color: 'rgb(200,200,200)' }}>
          © 2026 职场培训系统
        </p>
      </div>
    </div>
  );
}
