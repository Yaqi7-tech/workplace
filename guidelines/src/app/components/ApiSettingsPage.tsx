import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { getStoredApiConfig, saveApiConfig, checkApiConfig } from '@/app/services/api';
import { Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

interface ApiSettingsPageProps {
  onBack: () => void;
  onConfigured: () => void;
}

export function ApiSettingsPage({ onBack, onConfigured }: ApiSettingsPageProps) {
  const [npcKey, setNpcKey] = useState('');
  const [hintKey, setHintKey] = useState('');
  const [supervisorKey, setSupervisorKey] = useState('');
  const [showKeys, setShowKeys] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 初始化时加载已保存的配置
  useEffect(() => {
    const stored = getStoredApiConfig();
    setNpcKey(stored.npcKey);
    setHintKey(stored.hintKey);
    setSupervisorKey(stored.supervisorKey);
  }, []);

  const handleSave = () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // 验证输入
      if (!npcKey.trim() || !hintKey.trim() || !supervisorKey.trim()) {
        throw new Error('请填写所有 API Key');
      }

      // 验证 API Key 格式（Dify API Key 通常以 app- 开头）
      const keyFormatError = (keyName: string, key: string) => {
        if (!key.startsWith('app-')) {
          return `${keyName} 格式不正确，应该以 'app-' 开头`;
        }
        return null;
      };

      const npcError = keyFormatError('NPC API Key', npcKey);
      const hintError = keyFormatError('Hint API Key', hintKey);
      const supervisorError = keyFormatError('Supervisor API Key', supervisorKey);

      if (npcError) throw new Error(npcError);
      if (hintError) throw new Error(hintError);
      if (supervisorError) throw new Error(supervisorError);

      // 保存到 localStorage
      saveApiConfig({
        npcKey: npcKey.trim(),
        hintKey: hintKey.trim(),
        supervisorKey: supervisorKey.trim()
      });

      // 验证配置
      const check = checkApiConfig();
      if (!check.configured) {
        throw new Error(`配置验证失败: ${check.missing.join(', ')}`);
      }

      setSuccessMessage('API 配置已保存！');
      setTimeout(() => {
        onConfigured();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, rgb(254,254,250), rgb(254,253,249))' }}>
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
          <div className="mb-6">
            <button
              onClick={onBack}
              className="text-sm hover:opacity-70 flex items-center gap-1"
              style={{ color: 'rgb(122,122,122)' }}
            >
              ← 返回
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-[rgb(45,45,45)] mb-2">
              配置 Dify API
            </h1>
            <p className="text-[rgb(122,122,122)] mb-4">
              本项目需要您自己配置 Dify API Keys 才能使用
            </p>
            <a
              href="https://dify.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm hover:opacity-70"
              style={{ color: 'rgb(60,155,201)' }}
            >
              前往 Dify.ai 获取 API Keys <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <Alert className="mb-6" style={{ backgroundColor: 'rgb(254,225,153,0.3)', borderColor: 'rgb(254,225,153)' }}>
            <AlertDescription className="text-sm" style={{ color: 'rgb(45,45,45)' }}>
              <strong>获取步骤：</strong><br />
              1. 访问 <a href="https://cloud.dify.ai" target="_blank" className="underline" style={{ color: 'rgb(60,155,201)' }}>Dify Cloud</a> 或自建 Dify<br />
              2. 创建 3 个对话型应用（NPC、Hint、Supervisor）<br />
              3. 在应用设置中获取 API Key（格式：app-xxxxx）<br />
              4. 将 API Keys 填入下方表单
            </AlertDescription>
          </Alert>

          {successMessage && (
            <div className="p-3 rounded-lg border-2 mb-6" style={{ backgroundColor: 'rgb(176,214,169,0.3)', borderColor: 'rgb(176,214,169)' }}>
              <p className="text-sm" style={{ color: 'rgb(60,155,201)' }}>{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg border-2 mb-6" style={{ backgroundColor: 'rgb(252,117,123,0.2)', borderColor: 'rgb(252,117,123)' }}>
              <p className="text-sm" style={{ color: 'rgb(249,127,95)' }}>{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* NPC API Key */}
            <div className="space-y-2">
              <Label htmlFor="npcKey" className="flex items-center gap-2">
                <span>NPC API Key</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgb(252,117,123,0.2)', color: 'rgb(252,117,123)' }}>
                  带教老师角色扮演
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="npcKey"
                  type={showKeys ? 'text' : 'password'}
                  placeholder="app-xxxxxxxxxxxxxx"
                  value={npcKey}
                  onChange={(e) => setNpcKey(e.target.value)}
                  className="h-11 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(200,200,200)] hover:text-[rgb(122,122,122)]"
                >
                  {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hint API Key */}
            <div className="space-y-2">
              <Label htmlFor="hintKey" className="flex items-center gap-2">
                <span>Hint API Key</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgb(254,225,153,0.3)', color: 'rgb(45,45,45)' }}>
                  生成回复提示
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="hintKey"
                  type={showKeys ? 'text' : 'password'}
                  placeholder="app-xxxxxxxxxxxxxx"
                  value={hintKey}
                  onChange={(e) => setHintKey(e.target.value)}
                  className="h-11 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(200,200,200)] hover:text-[rgb(122,122,122)]"
                >
                  {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Supervisor API Key */}
            <div className="space-y-2">
              <Label htmlFor="supervisorKey" className="flex items-center gap-2">
                <span>Supervisor API Key</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgb(101,189,186,0.2)', color: 'rgb(101,189,186)' }}>
                  社交督导评价
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="supervisorKey"
                  type={showKeys ? 'text' : 'password'}
                  placeholder="app-xxxxxxxxxxxxxx"
                  value={supervisorKey}
                  onChange={(e) => setSupervisorKey(e.target.value)}
                  className="h-11 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(200,200,200)] hover:text-[rgb(122,122,122)]"
                >
                  {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="w-full h-11 text-white hover:opacity-90"
              style={{ backgroundColor: 'rgb(60,155,201)' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存配置'
              )}
            </Button>
          </div>

          <div className="mt-6 p-4 rounded-lg border" style={{ backgroundColor: 'rgb(250,250,250)', borderColor: 'rgb(230,230,230)' }}>
            <p className="text-xs text-[rgb(122,122,122)]">
              <strong>隐私说明：</strong>您的 API Keys 仅存储在浏览器的 localStorage 中，
              不会发送到除 Dify API 以外的任何服务器。配置完成后可随时在此页面修改。
            </p>
          </div>
        </div>

        <p className="text-center text-sm mt-8" style={{ color: 'rgb(200,200,200)' }}>
          © 2026 职场培训系统 - 开源项目
        </p>
      </div>
    </div>
  );
}
