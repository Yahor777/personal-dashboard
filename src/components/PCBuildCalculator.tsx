import { useState, useMemo } from 'react';
import { X, Cpu, MemoryStick, Zap, HardDrive, Box, AlertTriangle, CheckCircle2, Calculator, Sparkles, TrendingUp, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
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
  checkGPUCaseCompatibility,
  calculatePSURequirement,
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

interface PCBuildCalculatorProps {
  onClose: () => void;
}

export function PCBuildCalculator({ onClose }: PCBuildCalculatorProps) {
  const [selectedCPU, setSelectedCPU] = useState<string>('');
  const [selectedMotherboard, setSelectedMotherboard] = useState<string>('');
  const [selectedRAM, setSelectedRAM] = useState<string>('');
  const [selectedGPU, setSelectedGPU] = useState<string>('');
  const [selectedPSU, setSelectedPSU] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(true);

  // Get selected components
  const cpu = POPULAR_CPUS.find(c => c.id === selectedCPU);
  const motherboard = POPULAR_MOTHERBOARDS.find(m => m.id === selectedMotherboard);
  const ram = POPULAR_RAM.find(r => r.id === selectedRAM);
  const gpu = POPULAR_GPUS.find(g => g.id === selectedGPU);
  const psu = POPULAR_PSUS.find(p => p.id === selectedPSU);
  const caseItem = POPULAR_CASES.find(c => c.id === selectedCase);
  const storage = selectedStorage.map(id => POPULAR_STORAGE.find(s => s.id === id)).filter(Boolean) as StorageSpecs[];

  // Compatibility checks
  const compatibility = useMemo(() => {
    const issues = {
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[],
    };

    if (cpu && motherboard) {
      const check = checkCPUMotherboardCompatibility(cpu, motherboard);
      issues.errors.push(...check.errors);
      issues.warnings.push(...check.warnings);
      issues.suggestions.push(...check.suggestions);
    }

    if (ram && motherboard) {
      const check = checkRAMCompatibility(ram, motherboard);
      issues.errors.push(...check.errors);
      issues.warnings.push(...check.warnings);
      issues.suggestions.push(...check.suggestions);
    }

    if (gpu && caseItem) {
      const check = checkGPUCaseCompatibility(gpu, caseItem);
      issues.errors.push(...check.errors);
      issues.warnings.push(...check.warnings);
      issues.suggestions.push(...check.suggestions);
    }

    if (cpu && gpu) {
      const requiredPSU = calculatePSURequirement(cpu, gpu);
      if (psu && psu.wattage < requiredPSU) {
        issues.errors.push(`❌ Недостаточная мощность БП: требуется ${requiredPSU}W, выбрано ${psu.wattage}W`);
      } else if (!psu) {
        issues.suggestions.push(`💡 Рекомендуемая мощность БП: ${requiredPSU}W+`);
      }
    }

    return issues;
  }, [cpu, motherboard, ram, gpu, psu, caseItem]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    let price = 0;
    if (cpu) price += cpu.price;
    if (motherboard) price += motherboard.price;
    if (ram) price += ram.price;
    if (gpu) price += gpu.price;
    if (psu) price += psu.price;
    if (caseItem) price += caseItem.price;
    storage.forEach(s => price += s.price);
    return price;
  }, [cpu, motherboard, ram, gpu, psu, caseItem, storage]);

  const loadTemplate = (build: PCBuild) => {
    setSelectedCPU(build.cpu);
    setSelectedMotherboard(build.motherboard);
    setSelectedRAM(build.ram);
    setSelectedGPU(build.gpu);
    setSelectedPSU(build.psu);
    setSelectedCase(build.case);
    setSelectedStorage(build.storage);
    setShowTemplates(false);
  };

  const resetBuild = () => {
    setSelectedCPU('');
    setSelectedMotherboard('');
    setSelectedRAM('');
    setSelectedGPU('');
    setSelectedPSU('');
    setSelectedCase('');
    setSelectedStorage([]);
  };

  return (
    <div data-panel="true" className="fixed inset-y-0 right-0 z-50 flex w-full max-w-6xl flex-col border-l border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 pt-safe">
        <div className="flex items-center gap-3">
          <Calculator className="size-5 text-primary" />
          <div>
            <h2 className="font-semibold">🖥️ Калькулятор сборки ПК</h2>
            <p className="text-xs text-muted-foreground">Проверка совместимости и подсчёт цены</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
            {showTemplates ? 'Свой выбор' : 'Шаблоны'}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pb-safe">
          <div className="p-6 space-y-6">
          {showTemplates ? (
            /* Template Builds */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">🎯 Готовые сборки</h3>
                <Badge variant="secondary">{TEMPLATE_BUILDS.length} шаблонов</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEMPLATE_BUILDS.map((build) => (
                  <Card key={build.id} className="hover:border-primary cursor-pointer transition-all" onClick={() => loadTemplate(build)}>
                    <CardHeader>
                      <CardTitle className="text-base">{build.name}</CardTitle>
                      <CardDescription className="text-xs">{build.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Бюджет:</span>
                        <Badge className="bg-green-500/10 text-green-600">{build.totalPrice} zł</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Назначение:</span>
                        <span className="text-xs">{build.purpose.split(',')[0]}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Gaming</div>
                          <div className="font-semibold text-sm">{build.performance.gaming}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Work</div>
                          <div className="font-semibold text-sm">{build.performance.productivity}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Value</div>
                          <div className="font-semibold text-sm">{build.performance.value}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* Custom Build */
            <div className="space-y-6">
              {/* CPU Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cpu className="size-4" />
                    Процессор (CPU)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedCPU} onValueChange={setSelectedCPU}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите процессор..." />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_CPUS.map((cpu) => (
                        <SelectItem key={cpu.id} value={cpu.id}>
                          {cpu.name} - {cpu.price} zł ({cpu.cores}C/{cpu.threads}T, {cpu.tdp}W)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {cpu && (
                    <div className="mt-3 p-3 bg-muted rounded-lg space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Socket:</span>
                        <Badge variant="outline">{cpu.socket}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TDP:</span>
                        <span>{cpu.tdp}W</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Performance:</span>
                        <Badge className="bg-blue-500/10 text-blue-600">{cpu.performance}/100</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Motherboard Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="size-4" />
                    Материнская плата
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedMotherboard} onValueChange={setSelectedMotherboard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите материнскую плату..." />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_MOTHERBOARDS.map((mb) => (
                        <SelectItem key={mb.id} value={mb.id}>
                          {mb.name} - {mb.price} zł ({mb.socket}, {mb.ramType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {motherboard && (
                    <div className="mt-3 p-3 bg-muted rounded-lg space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Socket:</span>
                        <Badge variant="outline">{motherboard.socket}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RAM Type:</span>
                        <Badge variant="outline">{motherboard.ramType}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Form Factor:</span>
                        <span>{motherboard.formFactor}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* RAM Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MemoryStick className="size-4" />
                    Оперативная память (RAM)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedRAM} onValueChange={setSelectedRAM}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите оперативную память..." />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_RAM.map((ram) => (
                        <SelectItem key={ram.id} value={ram.id}>
                          {ram.name} - {ram.price} zł
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {ram && (
                    <div className="mt-3 p-3 bg-muted rounded-lg space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline">{ram.type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Speed:</span>
                        <span>{ram.speed} MHz</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span>{ram.capacity} GB ({ram.sticks}x{ram.capacity/ram.sticks}GB)</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* GPU Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="size-4" />
                    Видеокарта (GPU)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedGPU} onValueChange={setSelectedGPU}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите видеокарту..." />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_GPUS.map((gpu) => (
                        <SelectItem key={gpu.id} value={gpu.id}>
                          {gpu.name} - {gpu.price} zł ({gpu.vram}GB VRAM)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {gpu && (
                    <div className="mt-3 p-3 bg-muted rounded-lg space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VRAM:</span>
                        <span>{gpu.vram} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TDP:</span>
                        <span>{gpu.tdp}W</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Performance:</span>
                        <Badge className="bg-blue-500/10 text-blue-600">{gpu.performance}/100</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Compatibility Results */}
              {(cpu || motherboard || ram || gpu) && (
                <Card className={compatibility.errors.length > 0 ? 'border-destructive' : compatibility.warnings.length > 0 ? 'border-yellow-500' : 'border-green-500'}>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {compatibility.errors.length > 0 ? (
                        <><AlertTriangle className="size-4 text-destructive" /> Проблемы совместимости</>
                      ) : compatibility.warnings.length > 0 ? (
                        <><AlertTriangle className="size-4 text-yellow-500" /> Предупреждения</>
                      ) : (
                        <><CheckCircle2 className="size-4 text-green-500" /> Всё совместимо!</>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {compatibility.errors.map((error, i) => (
                      <div key={`error-${i}`} className="flex items-start gap-2 text-sm text-destructive">
                        <AlertTriangle className="size-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    ))}
                    {compatibility.warnings.map((warning, i) => (
                      <div key={`warning-${i}`} className="flex items-start gap-2 text-sm text-yellow-600">
                        <AlertTriangle className="size-4 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </div>
                    ))}
                    {compatibility.suggestions.map((suggestion, i) => (
                      <div key={`suggestion-${i}`} className="flex items-start gap-2 text-sm text-blue-600">
                        <Sparkles className="size-4 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer - Price Summary */}
      {!showTemplates && totalPrice > 0 && (
        <div className="border-t border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Общая стоимость сборки:</p>
              <p className="text-2xl font-bold text-green-600">{totalPrice} zł</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetBuild}>
                Сбросить
              </Button>
              <Button onClick={() => window.open(`https://www.olx.pl/d/oferty/q-pc-components`, '_blank')}>
                <TrendingUp className="mr-2 size-4" />
                Искать на OLX
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
