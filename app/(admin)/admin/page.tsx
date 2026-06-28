"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { getMembers } from "@/lib/services/members.service";
import { getTrainers } from "@/lib/services/trainers.service";
import {
  AreaChart, Area, XAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUp, ArrowDown, UserPlus, UserCheck, RefreshCw, MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const miniChartData = [
  { name: "Jan", value: 4 },
  { name: "Feb", value: 2 },
  { name: "Mar", value: 6 },
  { name: "Apr", value: 3 },
  { name: "May", value: 5 },
  { name: "Jun", value: 8 },
];

function CircularBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="relative w-[56px] h-[56px]">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="24" fill="none" stroke="#e8e8e8" strokeWidth="4" />
        <circle
          cx="28" cy="28" r="24" fill="none" stroke="#28c76f" strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 24}`}
          strokeDashoffset={`${2 * Math.PI * 24 * (1 - value / 100)}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold text-[#28c76f]">{value}</span>
        <span className="text-[8px] text-[#28c76f] font-medium">{label}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [trainerCount, setTrainerCount] = useState<number | null>(null);
  const [recentMembers, setRecentMembers] = useState<Array<{ id: string; name: string; plan?: string; createdAt?: any }>>([]);
  const [recentTrainers, setRecentTrainers] = useState<Array<{ id: string; name: string; specialization: string; createdAt?: any }>>([]);

  const [chartData, setChartData] = useState<Array<{ name: string, clients: number, trainers: number }>>([]);
  const [clientGrowth, setClientGrowth] = useState<number>(0);
  const [trainerGrowth, setTrainerGrowth] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      getMembers().catch(() => []),
      getTrainers().catch(() => [])
    ]).then(([m, t]) => {
      setMemberCount(m.length);
      setRecentMembers(m.slice(0, 5));
      setTrainerCount(t.length);
      setRecentTrainers(t.slice(0, 5));

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      let currentMonthClients = 0;
      let lastMonthClients = 0;
      let currentMonthTrainers = 0;
      let lastMonthTrainers = 0;

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dataMap = new Map<string, { clients: number, trainers: number }>();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
        dataMap.set(label, { clients: 0, trainers: 0 });
      }

      const processDoc = (doc: any, isClient: boolean) => {
        const time = doc.createdAt?.seconds;
        if (!time) return;
        const d = new Date(time * 1000);

        const monthKey = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (dataMap.has(monthKey)) {
          const current = dataMap.get(monthKey)!;
          if (isClient) current.clients++;
          else current.trainers++;
        }

        const dMonth = d.getMonth();
        const dYear = d.getFullYear();

        if (dYear === currentYear && dMonth === currentMonth) {
          isClient ? currentMonthClients++ : currentMonthTrainers++;
        } else if (dYear === lastMonthYear && dMonth === lastMonth) {
          isClient ? lastMonthClients++ : lastMonthTrainers++;
        }
      };

      m.forEach(doc => processDoc(doc, true));
      t.forEach(doc => processDoc(doc, false));

      const newChartData = Array.from(dataMap.entries()).map(([name, counts]) => ({
        name,
        clients: counts.clients,
        trainers: counts.trainers
      }));
      setChartData(newChartData);

      setClientGrowth(lastMonthClients === 0 ? (currentMonthClients > 0 ? 100 : 0) : Math.round(((currentMonthClients - lastMonthClients) / lastMonthClients) * 100));
      setTrainerGrowth(lastMonthTrainers === 0 ? (currentMonthTrainers > 0 ? 100 : 0) : Math.round(((currentMonthTrainers - lastMonthTrainers) / lastMonthTrainers) * 100));
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      {/* Mini chart spanning full width */}
      <motion.div
        className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#5e5873]">Registrations Over View</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#7367f0]" />
              <span className="text-[11px] text-[#6e6b7b] font-medium">Clients</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#28c76f]" />
              <span className="text-[11px] text-[#6e6b7b] font-medium">Trainers</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7367f0" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7367f0" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="trainerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#28c76f" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#28c76f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#b9b9c3" }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                boxShadow: "0 4px 24px 0 rgba(34, 41, 47, 0.1)"
              }}
              itemStyle={{ padding: '2px 0' }}
              labelStyle={{ fontWeight: 600, color: '#5e5873', marginBottom: 4 }}
              formatter={(value: any, name: any) => [value, `${name.charAt(0).toUpperCase() + name.slice(1)} Count`]}
            />
            <Area
              type="monotone"
              dataKey="clients"
              stroke="#7367f0"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#clientGrad)"
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="trainers"
              stroke="#28c76f"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#trainerGrad)"
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Three cards row: Action card + Total Clients + Total Trainers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Action Card */}
        <motion.div
          className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5 flex items-center justify-between"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="space-y-3 w-[220px]">
            <Button asChild className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-[15px] font-medium h-11 px-5 rounded-md shadow-[0_3px_10px_rgba(115,103,240,0.35)] w-full justify-start gap-3">
              <Link href="/admin/members">
                <UserPlus className="w-5 h-5 shrink-0" /> Add Clients
              </Link>
            </Button>
            <Button asChild className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-[15px] font-medium h-11 px-5 rounded-md shadow-[0_3px_10px_rgba(115,103,240,0.35)] w-full justify-start gap-3">
              <Link href="/admin/trainers">
                <UserCheck className="w-5 h-5 shrink-0" /> Add Trainers
              </Link>
            </Button>
            {/* <Button asChild className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-[15px] font-medium h-11 px-5 rounded-md shadow-[0_3px_10px_rgba(115,103,240,0.35)] w-full justify-start gap-3">
              <Link href="/admin/subscriptions">
                <RefreshCw className="w-5 h-5 shrink-0" /> Plan Renewal Request
              </Link>
            </Button> */}
          </div>
          <div className="hidden sm:block shrink-0 ml-4 relative w-[130px] h-[130px]">
            <Image src="/avtar.svg" alt="User Management Avatar" fill className="object-contain drop-shadow-md" priority />
          </div>
        </motion.div>

        {/* Total Clients Card */}
        <motion.div
          className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-[#5e5873]">Total Clients</h3>
              <p className="text-xs text-[#b9b9c3] mt-0.5">Monthly Report</p>
            </div>
            <CircularBadge value={0} label="Total" />
          </div>
          <p className="text-3xl font-bold text-[#5e5873] mt-4">{memberCount ?? "—"}</p>
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${clientGrowth >= 0 ? "text-[#28c76f]" : "text-[#ea5455]"}`}>
            {clientGrowth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            <span>{Math.abs(clientGrowth)}%</span>
          </div>
        </motion.div>

        {/* Total Trainers Card */}
        <motion.div
          className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-[#5e5873]">Total Trainers</h3>
              <p className="text-xs text-[#b9b9c3] mt-0.5">Monthly Report</p>
            </div>
            <CircularBadge value={0} label="Total" />
          </div>
          <p className="text-3xl font-bold text-[#5e5873] mt-4">{trainerCount ?? "—"}</p>
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trainerGrowth >= 0 ? "text-[#28c76f]" : "text-[#ea5455]"}`}>
            {trainerGrowth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            <span>{Math.abs(trainerGrowth)}%</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom section: Recent Clients + Trainers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Clients */}
        <motion.div
          className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#5e5873]">Recent Clients</h3>
              <div className="flex text-xs text-[#6e6b7b] gap-4">
                <span className="font-medium text-[#b9b9c3]">Membership</span>
              </div>
            </div>
          </div>
          <div className="px-5 pb-5">
            {recentMembers.length > 0 ? (
              <div className="space-y-2">
                {recentMembers.map((m, i) => (
                  <motion.div
                    key={m.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#7367f0]/10 text-[#7367f0] flex items-center justify-center text-xs font-bold">
                        {m.name.charAt(0)}
                      </div>
                      <span className="text-sm text-[#6e6b7b]">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[#b9b9c3]">{m.plan || "N/A"}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#b9b9c3]">No recent client available.</p>
            )}
          </div>
        </motion.div>

        {/* Trainers */}
        <motion.div
          className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#5e5873]">Trainers</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#b9b9c3]" />
              <Input placeholder="Search..." className="pl-8 h-8 text-xs w-[140px] border-gray-200" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-transparent border-b border-gray-100">
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Trainers</TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Specialized in which</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTrainers.map((t, i) => (
                <motion.tr
                  key={t.id}
                  className="border-b border-gray-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 + i * 0.04 }}
                >
                  <TableCell className="text-sm text-[#6e6b7b] py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#28c76f]/10 text-[#28c76f] flex items-center justify-center text-xs font-bold">
                        {t.name.charAt(0)}
                      </div>
                      {t.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#b9b9c3] py-2.5">{t.specialization}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </div>
  );
}
