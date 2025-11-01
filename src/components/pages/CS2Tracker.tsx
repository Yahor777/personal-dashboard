import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Target, TrendingUp, Crosshair, Map, Zap } from "lucide-react";
import { motion } from "motion/react";

const kpiData = [
  { title: "K/D Ratio", value: "1.45", change: "+0.15", icon: Target },
  { title: "Винрейт", value: "58%", change: "+3%", icon: TrendingUp },
  { title: "Хедшоты", value: "42%", change: "+5%", icon: Crosshair },
  { title: "ADR", value: "85.3", change: "+2.1", icon: Zap },
];

const matchHistory = [
  { map: "Mirage", result: "Win", score: "16-12", kills: 24, deaths: 18, kd: "1.33" },
  { map: "Dust 2", result: "Loss", score: "12-16", kills: 18, deaths: 21, kd: "0.86" },
  { map: "Inferno", result: "Win", score: "16-14", kills: 28, deaths: 19, kd: "1.47" },
  { map: "Nuke", result: "Win", score: "16-9", kills: 22, deaths: 15, kd: "1.47" },
  { map: "Ancient", result: "Loss", score: "14-16", kills: 20, deaths: 22, kd: "0.91" },
];

const mapPerformance = [
  { map: "Mirage", winrate: 65, matches: 42 },
  { map: "Dust 2", winrate: 58, matches: 38 },
  { map: "Inferno", winrate: 62, matches: 35 },
  { map: "Nuke", winrate: 48, matches: 28 },
  { map: "Ancient", winrate: 52, matches: 31 },
  { map: "Overpass", winrate: 55, matches: 26 },
];

const weaponStats = [
  { weapon: "AK-47", accuracy: 28, headshot: 45, kills: 340 },
  { weapon: "M4A4", accuracy: 32, headshot: 38, kills: 280 },
  { weapon: "AWP", accuracy: 75, headshot: 82, kills: 195 },
  { weapon: "Desert Eagle", accuracy: 22, headshot: 52, kills: 145 },
  { weapon: "USP-S", accuracy: 35, headshot: 48, kills: 98 },
];

const skillRadarData = [
  { skill: "Aim", value: 85 },
  { skill: "Game Sense", value: 78 },
  { skill: "Utility", value: 72 },
  { skill: "Positioning", value: 80 },
  { skill: "Communication", value: 75 },
  { skill: "Economy", value: 88 },
];

export function CS2Tracker() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>CS2 Tracker</h1>
          <p className="text-muted-foreground">Аналитика игровой статистики Counter-Strike 2</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="30">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 дней</SelectItem>
              <SelectItem value="30">30 дней</SelectItem>
              <SelectItem value="90">90 дней</SelectItem>
              <SelectItem value="all">Все время</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="competitive">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="competitive">Competitive</SelectItem>
              <SelectItem value="premier">Premier</SelectItem>
              <SelectItem value="wingman">Wingman</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>{kpi.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span>{kpi.value}</span>
                    <Badge variant="secondary">{kpi.change}</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Map Performance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Производительность по картам</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mapPerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="map" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="winrate" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skill Radar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Профиль навыков</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={skillRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Навыки"
                    dataKey="value"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Match History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>История матчей</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Карта</TableHead>
                  <TableHead>Результат</TableHead>
                  <TableHead>Счёт</TableHead>
                  <TableHead>Убийства</TableHead>
                  <TableHead>Смерти</TableHead>
                  <TableHead>K/D</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchHistory.map((match, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4 text-muted-foreground" />
                        {match.map}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={match.result === "Win" ? "default" : "destructive"}>
                        {match.result}
                      </Badge>
                    </TableCell>
                    <TableCell>{match.score}</TableCell>
                    <TableCell>{match.kills}</TableCell>
                    <TableCell>{match.deaths}</TableCell>
                    <TableCell>{match.kd}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weapon Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Статистика оружия</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Оружие</TableHead>
                  <TableHead>Точность</TableHead>
                  <TableHead>Хедшоты</TableHead>
                  <TableHead>Убийства</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weaponStats.map((weapon) => (
                  <TableRow key={weapon.weapon}>
                    <TableCell>{weapon.weapon}</TableCell>
                    <TableCell>{weapon.accuracy}%</TableCell>
                    <TableCell>{weapon.headshot}%</TableCell>
                    <TableCell>{weapon.kills}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
