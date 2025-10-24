import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Sparkles, Zap, TrendingUp, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { useStore } from '../store/useStore';
import {
  POPULAR_CPUS,
  POPULAR_MOTHERBOARDS,
  POPULAR_RAM,
  POPULAR_GPUS,
  POPULAR_PSUS,
  POPULAR_CASES,
  POPULAR_STORAGE,
  TEMPLATE_BUILDS,
  checkCPUMotherboardCompatibility,
  checkRAMCompatibility,
  calculatePSURequirement,
  checkGPUCaseCompatibility,
  calculateTotalBuildPrice,
  type CPUSpecs,
  type MotherboardSpecs,
  type RAMSpecs,
  type GPUSpecs,
  type PSUSpecs,
  type CaseSpecs,
  type StorageSpecs,
  type PCBuild,
} from '../data/pcComponents';
import { toast } from 'sonner';

interface PCBuilderPanelProps {
  onClose: () => void;
}

export function PCBuilderPanel({ onClose }: PCBuilderPanelProps) {
  const { sendMessage } = useStore();
  const [selectedCPU, setSelectedCPU] = useState<string>('');
  const [selectedMotherboard, setSelectedMotherboard] = useState<string>('');
  const [selectedRAM, setSelectedRAM] = useState<string>('');
  const [selectedGPU, setSelectedGPU] = useState<string>('');
  const [selectedPSU, setSelectedPSU] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  
  const [compatibilityChecks, setCompatibilityChecks] = useState<{
    cpuMotherboard: boolean;
    ramMotherboard: boolean;
    psuSufficient: boolean;
    gpuCase: boolean;
  }>({
    cpuMotherboard: true,
    ramMotherboard: true,
    psuSufficient: true,
    gpuCase: true,
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [recommendedPSU, setRecommendedPSU] = useState(0);

  // Получение выбранных компонентов
  const cpu = POPULAR_CPUS.find(c => c.id === selectedCPU);
  const motherboard = POPULAR_MOTHERBOARDS.find(m => m.id === selectedMotherboard);
  const ram = POPULAR_RAM.find(r => r.id === selectedRAM);
  const gpu = POPULAR_GPUS.find(g => g.id === selectedGPU);
  const psu = POPULAR_PSUS.find(p => p.id === selectedPSU);
  const caseItem = POPULAR_CASES.find(c => c.id === selectedCase);
  const storage = selectedStorage.map(id => POPULAR_STORAGE.find(s => s.id === id)).filter(Boolean) as StorageSpecs[];

  // Проверка совместимости при изменении компонентов
  useEffect(() => {
    const checks = {
      cpuMotherboard: true,
      ramMotherboard: true,
      psuSufficient: true,
      gpuCase: true,
    };

    // Проверка CPU + Motherboard
    if (cpu && motherboard) {
      const result = checkCPUMotherboardCompatibility(cpu, motherboard);
      checks.cpuMotherboard = result.compatible;
      if (!result.compatible) {
        result.errors.forEach(err => toast.error(err));
      }
    }

    // Проверка RAM + Motherboard
    if (ram && motherboard) {
      const result = checkRAMCompatibility(ram, motherboard);
      checks.ramMotherboard = result.compatible;
      if (!result.compatible) {
        result.errors.forEach(err => toast.error(err));
      }
    }

    // Расчёт мощности БП
    if (cpu && gpu) {
      const required = calculatePSURequirement(cpu, gpu);
      setRecommendedPSU(required);
      if (psu) {
        checks.psuSufficient = psu.wattage >= required;
        if (!checks.psuSufficient) {
          toast.warning(`⚠️ БП слабоват! Нужно минимум ${required}W, у тебя ${psu.wattage}W`);
        }
      }
    }

    // Проверка GPU + Case
    if (gpu && caseItem) {
      const result = checkGPUCaseCompatibility(gpu, caseItem);
      checks.gpuCase = result.compatible;
      if (!result.compatible) {
        result.errors.forEach(err => toast.error(err));
      }
    }

    setCompatibilityChecks(checks);
  }, [selectedCPU, selectedMotherboard, selectedRAM, selectedGPU, selectedPSU, selectedCase, cpu, motherboard, ram, gpu, psu, caseItem]);

  // Расчёт общей цены
  useEffect(() => {
    const price = calculateTotalBuildPrice({
      cpu: selectedCPU,
      motherboard: selectedMotherboard,
      ram: selectedRAM,
      gpu: selectedGPU,
      psu: selectedPSU,
      case: selectedCase,
      storage: selectedStorage,
    });
    setTotalPrice(price);
  }, [selectedCPU, selectedMotherboard, selectedRAM, selectedGPU, selectedPSU, selectedCase, selectedStorage]);

  const loadTemplate = (build: PCBuild) => {
    setSelectedCPU(build.cpu);
    setSelectedMotherboard(build.motherboard);
    setSelectedRAM(build.ram);
    setSelectedGPU(build.gpu);
    setSelectedPSU(build.psu);
    setSelectedCase(build.case);
    setSelectedStorage(build.storage);
    toast.success(`✅ Загружен шаблон: ${build.name}`);
  };

  const getAIAdvice = async () => {
    if (!cpu && !gpu && !motherboard) {
      toast.error('Выбери хотя бы несколько компонентов для анализа');
      return;
    }

    setIsLoadingAdvice(true);
    setAiAdvice('');

    const buildInfo = `
Текущая сборка ПК:
${cpu ? `- CPU: ${cpu.name} (${cpu.cores} ядер, ${cpu.tdp}W, сокет ${cpu.socket}) - ${cpu.price}zł` : '- CPU: не выбран'}
${motherboard ? `- Материнская плата: ${motherboard.name} (сокет ${motherboard.socket}, ${motherboard.ramType}) - ${motherboard.price}zł` : '- Материнская плата: не выбрана'}
${ram ? `- RAM: ${ram.name} (${ram.capacity}, ${ram.speed}MHz) - ${ram.price}zł` : '- RAM: не выбрана'}
${gpu ? `- GPU: ${gpu.name} (${gpu.vram}GB VRAM, ${gpu.tdp}W) - ${gpu.price}zł` : '- GPU: не выбрана'}
${psu ? `- БП: ${psu.name} (${psu.wattage}W, ${psu.efficiency}) - ${psu.price}zł` : '- БП: не выбран'}
${caseItem ? `- Корпус: ${caseItem.name} - ${caseItem.price}zł` : '- Корпус: не выбран'}
${storage.length > 0 ? `- Накопители: ${storage.map(s => `${s.name} (${s.capacity})`).join(', ')}` : '- Накопители: не выбраны'}

Общая стоимость: ${totalPrice}zł
Рекомендуемая мощность БП: ${recommendedPSU}W

Статус совместимости:
${compatibilityChecks.cpuMotherboard ? '✅' : '❌'} CPU ↔ Материнская плата
${compatibilityChecks.ramMotherboard ? '✅' : '❌'} RAM ↔ Материнская плата
${compatibilityChecks.psuSufficient ? '✅' : '❌'} Мощность БП
${compatibilityChecks.gpuCase ? '✅' : '❌'} GPU ↔ Корпус
`;

    try {
      const prompt = `${buildInfo}

Ты эксперт по сборке компьютеров. Проанализируй эту сборку и дай полезные советы:

1. 🎯 **Оценка сборки**: насколько хорошо подобраны компоненты?
2. ⚠️ **Узкие места**: есть ли bottleneck (например, слабая видеокарта для мощного процессора)?
3. 💡 **Рекомендации по улучшению**: что можно апгрейдить в первую очередь?
4. 💰 **Соотношение цена/производительность**: стоит ли своих денег?
5. 🎮 **Для каких задач подходит**: игры (какие FPS в CS2/Cyberpunk), программирование, монтаж видео?

Ответь кратко и по делу (3-5 предложений на каждый пункт).`;

      await sendMessage(prompt, (chunk) => {
        setAiAdvice(prev => prev + chunk);
      });

      toast.success('✅ AI анализ завершён');
    } catch (error) {
      toast.error('Ошибка при получении совета от AI');
      console.error(error);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const allCompatible = Object.values(compatibilityChecks).every(c => c);

  return (
    <div data-panel="true" className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 pt-safe">
        <div className="flex items-center gap-3">
          <Zap className="size-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold">🖥️ PC Builder - Калькулятор сборки</h2>
            <p className="text-sm text-muted-foreground">Подбери совместимые компоненты для своего ПК</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 pb-safe">
        <div className="p-6 space-y-6">
          {/* Готовые шаблоны */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5" />
                Готовые сборки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {TEMPLATE_BUILDS.map(build => (
                  <Card key={build.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => loadTemplate(build)}>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold">{build.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{build.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant="secondary">{build.totalPrice} zł</Badge>
                        <div className="flex gap-1">
                          <Badge variant="outline">🎮 {build.performance.gaming}</Badge>
                          <Badge variant="outline">💼 {build.performance.productivity}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Статус совместимости */}
          <Card className={allCompatible ? 'border-green-500' : 'border-red-500'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {allCompatible ? (
                    <CheckCircle className="size-8 text-green-500" />
                  ) : (
                    <XCircle className="size-8 text-red-500" />
                  )}
                  <div>
                    <h3 className="font-bold text-lg">
                      {allCompatible ? '✅ Все компоненты совместимы!' : '❌ Есть проблемы с совместимостью'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {allCompatible ? 'Можно собирать!' : 'Проверь выбранные компоненты'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{totalPrice} zł</p>
                  <p className="text-sm text-muted-foreground">Общая стоимость</p>
                </div>
              </div>

              {/* Детали совместимости */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  {compatibilityChecks.cpuMotherboard ? (
                    <CheckCircle className="size-4 text-green-500" />
                  ) : (
                    <XCircle className="size-4 text-red-500" />
                  )}
                  <span className="text-sm">CPU ↔ MB</span>
                </div>
                <div className="flex items-center gap-2">
                  {compatibilityChecks.ramMotherboard ? (
                    <CheckCircle className="size-4 text-green-500" />
                  ) : (
                    <XCircle className="size-4 text-red-500" />
                  )}
                  <span className="text-sm">RAM ↔ MB</span>
                </div>
                <div className="flex items-center gap-2">
                  {compatibilityChecks.psuSufficient ? (
                    <CheckCircle className="size-4 text-green-500" />
                  ) : (
                    <XCircle className="size-4 text-red-500" />
                  )}
                  <span className="text-sm">PSU OK</span>
                </div>
                <div className="flex items-center gap-2">
                  {compatibilityChecks.gpuCase ? (
                    <CheckCircle className="size-4 text-green-500" />
                  ) : (
                    <XCircle className="size-4 text-red-500" />
                  )}
                  <span className="text-sm">GPU ↔ Case</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Advisor */}
          <Card className="border-purple-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="size-5 text-purple-500" />
                  🤖 AI Советник по сборке
                </CardTitle>
                <Button 
                  onClick={getAIAdvice} 
                  disabled={isLoadingAdvice || (!cpu && !gpu && !motherboard)}
                  variant="outline"
                  size="sm"
                >
                  {isLoadingAdvice ? 'Анализирую...' : 'Получить совет'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!aiAdvice && !isLoadingAdvice && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="size-12 mx-auto mb-3 opacity-50" />
                  <p>Выбери компоненты и нажми "Получить совет"</p>
                  <p className="text-sm mt-2">AI проанализирует твою сборку и даст рекомендации</p>
                </div>
              )}
              {isLoadingAdvice && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              {aiAdvice && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{aiAdvice}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Выбор компонентов */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* CPU */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">⚡ Процессор (CPU)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCPU} onValueChange={setSelectedCPU}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выбери CPU" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_CPUS.map(cpu => (
                      <SelectItem key={cpu.id} value={cpu.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{cpu.name}</span>
                          <Badge variant="outline" className="ml-2">{cpu.price} zł</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cpu && (
                  <div className="mt-3 text-sm space-y-1">
                    <p>Socket: <Badge variant="secondary">{cpu.socket}</Badge></p>
                    <p>Ядра: {cpu.cores} / Потоки: {cpu.threads}</p>
                    <p>TDP: {cpu.tdp}W</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Motherboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">🔌 Материнская плата</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedMotherboard} onValueChange={setSelectedMotherboard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выбери материнку" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_MOTHERBOARDS.map(mb => (
                      <SelectItem key={mb.id} value={mb.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{mb.name}</span>
                          <Badge variant="outline" className="ml-2">{mb.price} zł</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {motherboard && (
                  <div className="mt-3 text-sm space-y-1">
                    <p>Socket: <Badge variant="secondary">{motherboard.socket}</Badge></p>
                    <p>RAM: <Badge variant="secondary">{motherboard.ramType}</Badge></p>
                    <p>Chipset: {motherboard.chipset}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RAM */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">💾 Оперативная память</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedRAM} onValueChange={setSelectedRAM}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выбери RAM" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_RAM.map(ram => (
                      <SelectItem key={ram.id} value={ram.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{ram.name}</span>
                          <Badge variant="outline" className="ml-2">{ram.price} zł</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ram && (
                  <div className="mt-3 text-sm space-y-1">
                    <p>Тип: <Badge variant="secondary">{ram.type}</Badge></p>
                    <p>Частота: {ram.speed} MHz</p>
                    <p>Объём: {ram.capacity} GB ({ram.sticks}x{ram.capacity/ram.sticks}GB)</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GPU */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">🎮 Видеокарта (GPU)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedGPU} onValueChange={setSelectedGPU}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выбери GPU" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_GPUS.map(gpu => (
                      <SelectItem key={gpu.id} value={gpu.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{gpu.name}</span>
                          <Badge variant="outline" className="ml-2">{gpu.price} zł</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {gpu && (
                  <div className="mt-3 text-sm space-y-1">
                    <p>VRAM: {gpu.vram} GB</p>
                    <p>TDP: {gpu.tdp}W</p>
                    <p>Длина: {gpu.length} mm</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PSU */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">🔋 Блок питания (PSU)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedPSU} onValueChange={setSelectedPSU}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выбери БП" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_PSUS.map(psu => (
                      <SelectItem key={psu.id} value={psu.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{psu.name}</span>
                          <Badge variant="outline" className="ml-2">{psu.price} zł</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {recommendedPSU > 0 && (
                  <div className="mt-3">
                    <p className="text-sm">
                      Рекомендуется: <Badge variant="secondary">{recommendedPSU}W+</Badge>
                    </p>
                    {psu && (
                      <div className="mt-2">
                        <Progress value={(psu.wattage / recommendedPSU) * 100} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {psu.wattage}W / {recommendedPSU}W
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Case */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">📦 Корпус</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCase} onValueChange={setSelectedCase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выбери корпус" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_CASES.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{c.name}</span>
                          <Badge variant="outline" className="ml-2">{c.price} zł</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {caseItem && (
                  <div className="mt-3 text-sm space-y-1">
                    <p>Форм-фактор: {caseItem.formFactor.join(', ')}</p>
                    <p>Max GPU: {caseItem.maxGPULength} mm</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
