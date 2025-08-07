// src/pages/Dashboard.js
import React from 'react';
import Sidebar from '../components/SideBar';
import ChartCard from '../components/ChartCard';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const pieData = [
  { name: 'Very Satisfied', value: 63 },
  { name: 'Satisfied', value: 12 },
  { name: 'Somewhat Satisfied', value: 25 },
];
const pieColors = ['#5B4EFF', '#7FDBFF', '#E0E0E0'];

const barData = [
  { name: 'Q1', always: 60, most: 30 },
  { name: 'Q2', always: 50, most: 25 },
  { name: 'Q3', always: 70, most: 35 },
  { name: 'Q4', always: 80, most: 40 },
  { name: 'Q5', always: 75, most: 38 },
  { name: 'Q6', always: 60, most: 10 },
  { name: 'Q7', always: 70, most: 35 },
  { name: 'Q8', always: 65, most: 30 },
  { name: 'Q9', always: 60, most: 25 },
  { name: 'Q10', always: 70, most: 28 },
];

export default function Dashboard() {
  return (
    <div className="flex bg-[#f7f9fc] min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard – Retirement Village</h1>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <ChartCard title="Response" content={<>
            <h2 className="text-3xl font-bold">279</h2>
            <p className="text-gray-500">Participants</p>
            <h2 className="text-xl font-bold mt-4">23%</h2>
            <p className="text-gray-500">Response Rate</p>
          </>} />

          <ChartCard title="Satisfaction Score" content={
            <PieChart width={160} height={160}>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={pieColors[index]} />)}
              </Pie>
            </PieChart>
          } />

          <ChartCard title="Net Promoter Score" content={<>
            <div className="text-4xl font-bold text-[#5B4EFF]">72</div>
            <div className="text-sm text-gray-400">-100 to +100</div>
          </>} />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <ChartCard title="Response Classification" content={<>
            <div className="mb-2">
              <p className="text-sm text-gray-600">Residents</p>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-[#7FDBFF] rounded-full" style={{ width: '35%' }}></div>
              </div>
              <p className="text-xs">98</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">NoK</p>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-[#7FDBFF] rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-xs">181</p>
            </div>
          </>} />

          <ChartCard title="Service" content={<>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="most" stackId="a" fill="#7FDBFF" />
                <Bar dataKey="always" stackId="a" fill="#5B4EFF" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-2">Note: Data comes from the last 12 months.</div>
          </>} />
        </div>
      </div>
    </div>
  );
}