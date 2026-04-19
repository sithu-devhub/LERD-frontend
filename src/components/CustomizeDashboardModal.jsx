// src/componenets/CustomizeDashboardModal.jsx
import React from "react";
import { X, PencilLine, RotateCcw, Save } from "lucide-react";

export default function CustomizeDashboardModal({
    open,
    onClose,
    dashboardName,
    setDashboardName,
    services = [],
    serviceLabels = {},
    onServiceLabelChange,
    regions = [],
    attributes = [],
    regionLabels = {},
    attributeLabels = {},
    onRegionLabelChange,
    onAttributeLabelChange,
    onReset,
    onSave,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 px-4 py-6">
            <div className="relative w-full max-w-4xl max-h-[90vh] rounded-[28px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] border border-slate-200 overflow-hidden flex flex-col">
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                    <X size={20} />
                </button>

                <div className="px-8 pt-8 pb-6 flex flex-col min-h-0">
                    <div className="text-center mb-8">
                        <h2 className="text-[32px] font-bold tracking-tight text-indigo-900">
                            Customize Dashboard Naming
                        </h2>
                        <p className="mt-2 text-[16px] text-slate-500">
                            Edit labels displayed in the dashboard
                        </p>
                    </div>

                    <div className="space-y-8 overflow-y-auto pr-2 min-h-0 flex-1">
                        {/* Dashboard name */}
                        <section>
                            <label className="mb-3 block text-[15px] font-semibold text-slate-700">
                                Dashboard Name
                            </label>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={dashboardName}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        const safeLabelPattern = /^[a-zA-Z0-9\s\-_.()]*$/;

                                        if (safeLabelPattern.test(value) && value.length <= 50) {
                                            setDashboardName(value);
                                        }
                                    }} placeholder="Enter dashboard name"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 pr-14 text-[17px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                                />
                                <PencilLine
                                    size={18}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                            </div>
                        </section>

                        {/* Service names */}
                        <section>
                            <div className="rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="grid grid-cols-2 bg-slate-50 px-5 py-4">
                                    <div className="text-[15px] font-semibold text-slate-700">
                                        Service Name
                                    </div>
                                    <div className="text-[15px] font-semibold text-slate-700">
                                        Custom Label
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {services.map((service) => (
                                        <div
                                            key={service.id}
                                            className="grid grid-cols-2 items-center px-5 py-4"
                                        >
                                            <div className="pr-4 text-[16px] text-slate-600">
                                                {service.name}
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={serviceLabels[service.id] || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;

                                                        const safeLabelPattern = /^[a-zA-Z0-9\s\-_.()]*$/;

                                                        if (safeLabelPattern.test(value) && value.length <= 50) {
                                                            onServiceLabelChange(service.id, value);
                                                        }
                                                    }}
                                                    placeholder={service.name}
                                                    className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 pr-12 text-[15px] text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                                                />
                                                <PencilLine
                                                    size={16}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Region names */}
                        <section>
                            <div className="rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="grid grid-cols-2 bg-slate-50 px-5 py-4">
                                    <div className="text-[15px] font-semibold text-slate-700">
                                        Region Name
                                    </div>
                                    <div className="text-[15px] font-semibold text-slate-700">
                                        Custom Label
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {regions.map((region) => (
                                        <div
                                            key={region.id}
                                            className="grid grid-cols-2 items-center px-5 py-4"
                                        >
                                            <div className="pr-4 text-[16px] text-slate-600">
                                                {region.name}
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={regionLabels[region.id] || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;

                                                        const safeLabelPattern = /^[a-zA-Z0-9\s\-_.()]*$/;

                                                        if (safeLabelPattern.test(value) && value.length <= 50) {
                                                            onRegionLabelChange(region.id, value);
                                                        }
                                                    }}
                                                    placeholder={region.name}
                                                    className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 pr-12 text-[15px] text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                                                />
                                                <PencilLine
                                                    size={16}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Service attributes */}
                        <section>
                            <div className="rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="grid grid-cols-2 bg-slate-50 px-5 py-4">
                                    <div className="text-[15px] font-semibold text-slate-700">
                                        Service Attribute
                                    </div>
                                    <div className="text-[15px] font-semibold text-slate-700">
                                        Custom Label
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {attributes.map((attr) => (
                                        <div
                                            key={attr.id}
                                            className="grid grid-cols-2 items-center px-5 py-4"
                                        >
                                            <div className="pr-4 text-[16px] text-slate-600">
                                                {attr.name}
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={attributeLabels[attr.id] || ""}
                                                    onChange={(e) =>
                                                        onAttributeLabelChange(attr.id, e.target.value)
                                                    }
                                                    placeholder={attr.name}
                                                    className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 pr-12 text-[15px] text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                                                />
                                                <PencilLine
                                                    size={16}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Note */}
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                            <p className="text-[15px] text-amber-900">
                                Custom labels only affect dashboard display.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex items-center justify-end gap-4">
                        <button
                            onClick={onSave}
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3 text-[15px] font-semibold text-white shadow-[0_10px_25px_rgba(79,70,229,0.28)] transition hover:from-indigo-700 hover:to-violet-700"
                        >
                            <Save size={16} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}