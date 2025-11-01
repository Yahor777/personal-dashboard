import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Cpu, HardDrive, MemoryStick, Zap, Box, AlertCircle, Check, Download } from "lucide-react";
import { Progress } from "../ui/progress";
import { motion } from "motion/react";

interface Component {
  category: string;
  name: string;
  price: number;
  power?: number;
}

const componentCategories = [
  { id: "cpu", name: "Процессор", icon: Cpu, options: [
    { name: "Intel Core i9-13900K", price: 45000, power: 125 },
    { name: "AMD Ryzen 9 7950X", price: 48000, power: 170 },
    { name: "Intel Core i7-13700K", price: 38000, power: 125 },
  ]},
  { id: "gpu", name: "Видеокарта", icon: HardDrive, options: [
    { name: "RTX 4090", price: 120000, power: 450 },
    { name: "RTX 4070 Ti", price: 55000, power: 285 },
    { name: "RX 7900 XTX", price: 68000, power: 355 },
  ]},
  { id: "ram", name: "ОЗУ", icon: MemoryStick, options: [
    { name: "DDR5 32GB 6000MHz", price: 12500, power: 10 },
    { name: "DDR5 64GB 5600MHz", price: 22000, power: 15 },
    { name: "DDR4 32GB 3600MHz", price: 8500, power: 8 },
  ]},
  { id: "storage", name: "Накопитель", icon: HardDrive, options: [
    { name: "Samsung 980 PRO 2TB", price: 14500, power: 7 },
    { name: "WD Black SN850X 1TB", price: 9800, power: 6 },
    { name: "Crucial P5 Plus 2TB", price: 12000, power: 5 },
  ]},
  { id: "psu", name: "БП", icon: Zap, options: [
    { name: "Corsair RM1000x", price: 18000, power: 0 },
    { name: "Seasonic Focus GX-850", price: 14500, power: 0 },
    { name: "EVGA SuperNOVA 750W", price: 11000, power: 0 },
  ]},
  { id: "case", name: "Корпус", icon: Box, options: [
    { name: "Fractal Design Torrent", price: 16000, power: 0 },
    { name: "Lian Li O11 Dynamic", price: 13500, power: 0 },
    { name: "NZXT H510 Elite", price: 11000, power: 0 },
  ]},
];

export function PCBuilder() {
  const [selectedComponents, setSelectedComponents] = useState<Record<string, Component>>({});

  const totalPrice = Object.values(selectedComponents).reduce((sum, c) => sum + c.price, 0);
  const totalPower = Object.values(selectedComponents).reduce(
    (sum, c) => sum + (c.power || 0),
    0
  );

  const psuWattage = selectedComponents.psu?.name.match(/\d+/)?.[0] || "0";
  const psuCapacity = parseInt(psuWattage);
  const powerUsage = (totalPower / psuCapacity) * 100;

  const isCompatible = powerUsage < 90 && Object.keys(selectedComponents).length >= 4;

  const handleSelectComponent = (categoryId: string, component: any) => {
    setSelectedComponents((prev) => ({
      ...prev,
      [categoryId]: {
        category: categoryId,
        name: component.name,
        price: component.price,
        power: component.power,
      },
    }));
  };

  const exportConfig = (format: string) => {
    const config = {
      components: selectedComponents,
      totalPrice,
      totalPower,
      date: new Date().toISOString(),
    };
    console.log(`Exporting as ${format}:`, config);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>PC Builder</h1>
          <p className="text-muted-foreground">Соберите свой идеальный компьютер</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportConfig("json")}>
            Экспорт JSON
          </Button>
          <Button variant="outline" onClick={() => exportConfig("csv")}>
            Экспорт CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Component Selection */}
        <div className="space-y-4 lg:col-span-2">
          {componentCategories.map((category, index) => {
            const Icon = category.icon;
            const selected = selectedComponents[category.id];
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {category.name}
                      {selected && <Check className="h-4 w-4 text-green-500" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select
                      value={selected?.name}
                      onValueChange={(value) => {
                        const component = category.options.find((o) => o.name === value);
                        if (component) {
                          handleSelectComponent(category.id, component);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите компонент" />
                      </SelectTrigger>
                      <SelectContent>
                        {category.options.map((option) => (
                          <SelectItem key={option.name} value={option.name}>
                            <div className="flex items-center justify-between gap-4">
                              <span>{option.name}</span>
                              <span className="text-muted-foreground">
                                ₽{option.price.toLocaleString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selected && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>₽{selected.price.toLocaleString()}</span>
                        {selected.power && <span>{selected.power}W</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Сводка сборки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Компоненты</span>
                  <span>{Object.keys(selectedComponents).length} / 6</span>
                </div>
                <Progress value={(Object.keys(selectedComponents).length / 6) * 100} />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Общая мощность</span>
                  <span>{totalPower}W</span>
                </div>
                {psuCapacity > 0 && (
                  <>
                    <Progress
                      value={powerUsage}
                      className={powerUsage > 90 ? "bg-red-500" : ""}
                    />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {powerUsage > 90 ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      <span>
                        {powerUsage.toFixed(0)}% от {psuCapacity}W
                      </span>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Совместимость</span>
                  {isCompatible ? (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" />
                      ОК
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Проверьте
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Итоговая цена</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-green-500">₽{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Сохранить сборку
                </Button>
                <Button variant="outline" className="w-full">
                  Сбросить
                </Button>
              </div>

              {Object.keys(selectedComponents).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Выбранные компоненты:</span>
                    {Object.values(selectedComponents).map((comp) => (
                      <div
                        key={comp.category}
                        className="text-muted-foreground line-clamp-1"
                      >
                        • {comp.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
