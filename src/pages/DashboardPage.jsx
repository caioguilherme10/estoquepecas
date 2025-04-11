// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, AlertTriangle, CheckCircle, RotateCw } from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    BarChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
// Função para formatar moeda
const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
// Função para formatar datas para o eixo X (ex: DD/MM)
const formatDateForAxis = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return '';
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}`;
    } catch (e) {
        return dateString; // Retorna original em caso de erro
    }
};
// Componente de Card de Sumário
const SummaryCard = ({ title, value, icon: Icon, colorClass = 'text-blue-500', isLoading }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center space-x-4">
        <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
            <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            {isLoading ? (
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse mt-1"></div>
            ) : (
                 <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
            )}
        </div>
    </div>
);
// Componente Principal do Dashboard
const DashboardPage = () => {
    const [summaryData, setSummaryData] = useState(null);
    const [salesChartData, setSalesChartData] = useState([]);
    const [purchasesChartData, setPurchasesChartData] = useState([]);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingCharts, setLoadingCharts] = useState(true);
    const [error, setError] = useState(null);
    const [periodDays, setPeriodDays] = useState(30); // Estado para controlar o período
    const fetchData = async (days) => {
        setLoadingSummary(true);
        setLoadingCharts(true);
        setError(null);
        try {
            // Usando Promise.all para buscar dados em paralelo
            const [summary, salesData, purchasesData] = await Promise.all([
                window.api.getDashboardSummary(days),
                window.api.getSalesDataForChart(days),
                window.api.getPurchasesDataForChart(days)
            ]);
            setSummaryData(summary);
            setSalesChartData(salesData || []);
            setPurchasesChartData(purchasesData || []);
        } catch (err) {
            console.error("Erro ao carregar dados do dashboard:", err);
            setError(`Falha ao carregar dados: ${err.message}`);
        } finally {
            setLoadingSummary(false);
            setLoadingCharts(false);
        }
    };
    useEffect(() => {
        fetchData(periodDays);
    }, [periodDays]); // Re-busca quando o período mudar
    // Formatar dados para o Tooltip do gráfico
    const renderCustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-700 p-2 border border-gray-300 dark:border-gray-600 rounded shadow text-sm">
                    <p className="label font-semibold dark:text-gray-100">{`Data: ${formatDateForAxis(label)}`}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color }}>
                            {`${entry.name}: ${formatCurrency(entry.value)}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };
    return (
        <div className="container mx-auto px-4 py-6 dark:text-gray-100 space-y-6">
            {/* Cabeçalho e Seletor de Período */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                    Dashboard
                </h1>
                <div className='flex items-center gap-2'>
                    <label htmlFor="periodSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Período:
                    </label>
                    <select
                        id="periodSelect"
                        value={periodDays}
                        onChange={(e) => setPeriodDays(Number(e.target.value))}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                        disabled={loadingSummary || loadingCharts}
                    >
                        <option value={7}>Últimos 7 dias</option>
                        <option value={30}>Últimos 30 dias</option>
                        <option value={90}>Últimos 90 dias</option>
                    </select>
                    <button
                        onClick={() => fetchData(periodDays)}
                        disabled={loadingSummary || loadingCharts}
                        title="Recarregar Dados"
                        className="p-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                        <RotateCw size={16} className={(loadingSummary || loadingCharts) ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    {error}
                </div>
            )}
            {/* Grid de Sumários */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <SummaryCard
                    title={`Vendas (${periodDays} dias)`}
                    value={formatCurrency(summaryData?.totalVendasValue)}
                    icon={DollarSign}
                    colorClass="text-green-500"
                    isLoading={loadingSummary}
                />
                <SummaryCard
                    title={`Nº Vendas (${periodDays} dias)`}
                    value={summaryData?.totalVendasCount?.toLocaleString('pt-BR') ?? '0'}
                    icon={ShoppingCart}
                    colorClass="text-green-500"
                    isLoading={loadingSummary}
                />
                <SummaryCard
                    title={`Compras (${periodDays} dias)`}
                    value={formatCurrency(summaryData?.totalComprasValue)}
                    icon={DollarSign}
                    colorClass="text-blue-500"
                    isLoading={loadingSummary}
                />
                <SummaryCard
                    title="Produtos Ativos"
                    value={summaryData?.activeProductsCount?.toLocaleString('pt-BR') ?? '0'}
                    icon={CheckCircle}
                    colorClass="text-indigo-500"
                    isLoading={loadingSummary}
                />
                <SummaryCard
                    title="Estoque Baixo"
                    value={summaryData?.lowStockCount?.toLocaleString('pt-BR') ?? '0'}
                    icon={AlertTriangle}
                    colorClass={summaryData?.lowStockCount > 0 ? "text-red-500" : "text-yellow-500"} // Vermelho se > 0
                    isLoading={loadingSummary}
                />
            </div>
            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Vendas */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Vendas Diárias ({periodDays} dias)</h3>
                    {loadingCharts ? (
                        <div className="flex justify-center items-center h-60">
                            <RotateCw className="animate-spin h-8 w-8 text-blue-500"/>
                        </div>
                    ) : salesChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={salesChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" /> {/* Ajuste cor dark mode */}
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDateForAxis}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }} // Cor e tamanho do tick
                                    axisLine={{ stroke: '#6B7280' }}
                                    tickLine={{ stroke: '#6B7280' }}
                                />
                                <YAxis
                                    tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    axisLine={{ stroke: '#6B7280' }}
                                    tickLine={{ stroke: '#6B7280' }}
                                    width={80} // Ajuste largura para caber R$
                                />
                                <Tooltip content={renderCustomTooltip} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    name="Vendas"
                                    stroke="#10B981" // Verde
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex justify-center items-center h-60 text-gray-500 dark:text-gray-400">
                            Sem dados de vendas para o período.
                        </div>
                    )}
                </div>
                {/* Gráfico de Compras */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Compras Diárias ({periodDays} dias)</h3>
                    {loadingCharts ? (
                        <div className="flex justify-center items-center h-60">
                            <RotateCw className="animate-spin h-8 w-8 text-blue-500"/>
                        </div>
                    ) : purchasesChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            {/* Pode usar BarChart ou LineChart */}
                            <BarChart data={purchasesChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDateForAxis}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    axisLine={{ stroke: '#6B7280' }}
                                    tickLine={{ stroke: '#6B7280' }}
                                />
                                <YAxis
                                    tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    axisLine={{ stroke: '#6B7280' }}
                                    tickLine={{ stroke: '#6B7280' }}
                                    width={80}
                                />
                                <Tooltip content={renderCustomTooltip} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                                <Bar
                                    dataKey="total"
                                    name="Compras"
                                    fill="#3B82F6" // Azul
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex justify-center items-center h-60 text-gray-500 dark:text-gray-400">
                            Sem dados de compras para o período.
                        </div>
                    )}
                </div>
            </div>
            {/* Outras seções podem ser adicionadas aqui, como Produtos com Estoque Baixo */}
        </div>
    );
};

export default DashboardPage;