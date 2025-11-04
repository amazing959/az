import { useState, useEffect } from 'react';
import { Search, TrendingUp, BarChart3 } from 'lucide-react';
import { supabase, Item, Price } from '../../lib/supabase';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ItemWithPrice extends Item {
  latest_price?: number;
}

interface PriceData {
  date: string;
  price: number;
}

export default function PriceVisualization() {
  const [items, setItems] = useState<ItemWithPrice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [compareItems, setCompareItems] = useState<string[]>([]);
  const [comparePriceHistory, setComparePriceHistory] = useState<Record<string, PriceData[]>>({});

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('name');

      if (itemsError) throw itemsError;

      const itemsWithPrices = await Promise.all(
        (itemsData || []).map(async (item) => {
          const { data: priceData } = await supabase
            .from('prices')
            .select('price')
            .eq('item_id', item.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...item,
            latest_price: priceData?.price,
          };
        })
      );

      setItems(itemsWithPrices);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceHistory = async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('prices')
        .select('date, price')
        .eq('item_id', itemId)
        .order('date', { ascending: true })
        .limit(7);

      if (error) throw error;
      setPriceHistory(data || []);
    } catch (error) {
      console.error('Error loading price history:', error);
    }
  };

  const loadComparePriceHistory = async (itemIds: string[]) => {
    try {
      const histories: Record<string, PriceData[]> = {};

      for (const itemId of itemIds) {
        const { data, error } = await supabase
          .from('prices')
          .select('date, price')
          .eq('item_id', itemId)
          .order('date', { ascending: true })
          .limit(7);

        if (error) throw error;
        histories[itemId] = data || [];
      }

      setComparePriceHistory(histories);
    } catch (error) {
      console.error('Error loading compare price history:', error);
    }
  };

  const handleSelectItem = (itemId: string) => {
    if (compareMode) {
      if (compareItems.includes(itemId)) {
        const newItems = compareItems.filter((id) => id !== itemId);
        setCompareItems(newItems);
        if (newItems.length > 0) {
          loadComparePriceHistory(newItems);
        }
      } else if (compareItems.length < 3) {
        const newItems = [...compareItems, itemId];
        setCompareItems(newItems);
        loadComparePriceHistory(newItems);
      }
    } else {
      setSelectedItem(itemId);
      loadPriceHistory(itemId);
    }
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setCompareItems([]);
    setComparePriceHistory({});
    setSelectedItem(null);
    setPriceHistory([]);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = compareMode
    ? {
        labels: Object.values(comparePriceHistory)[0]?.map((p) =>
          new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        ) || [],
        datasets: compareItems.map((itemId, index) => {
          const item = items.find((i) => i.id === itemId);
          const colors = [
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(234, 179, 8)',
          ];
          return {
            label: item?.name || '',
            data: comparePriceHistory[itemId]?.map((p) => p.price) || [],
            borderColor: colors[index],
            backgroundColor: colors[index].replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
          };
        }),
      }
    : {
        labels: priceHistory.map((p) =>
          new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        ),
        datasets: [
          {
            label: 'Price (PKR/kg)',
            data: priceHistory.map((p) => p.price),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.3,
          },
        ],
      };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: Rs. ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function (value: any) {
            return 'Rs. ' + value;
          },
        },
      },
    },
  };

  if (loading) {
    return <div className="text-center py-8">Loading prices...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Price Trends & Analysis</h2>
          <p className="text-gray-600 mt-1">Track market rates and 7-day price trends</p>
        </div>
        <button
          onClick={toggleCompareMode}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
            compareMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>{compareMode ? 'Exit Compare' : 'Compare Items'}</span>
        </button>
      </div>

      {compareMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>Compare Mode:</strong> Select up to 3 items to compare their 7-day price trends.
            Selected: {compareItems.length}/3
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No items found</p>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = compareMode
                    ? compareItems.includes(item.id)
                    : selectedItem === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-green-50 border-2 border-green-500'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <span className="text-xs text-gray-500">{item.category}</span>
                        </div>
                        {item.latest_price && (
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              Rs. {item.latest_price.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">Latest</p>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {!compareMode && !selectedItem && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select an Item to View Trends
                </h3>
                <p className="text-gray-600">
                  Choose any vegetable or fruit to see its 7-day price trend
                </p>
              </div>
            )}

            {!compareMode && selectedItem && priceHistory.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  7-Day Price Trend:{' '}
                  {items.find((i) => i.id === selectedItem)?.name}
                </h3>
                <Line data={chartData} options={chartOptions} />
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Current Price</p>
                    <p className="text-xl font-bold text-gray-900">
                      Rs. {priceHistory[priceHistory.length - 1]?.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Average Price</p>
                    <p className="text-xl font-bold text-gray-900">
                      Rs.{' '}
                      {(
                        priceHistory.reduce((sum, p) => sum + p.price, 0) /
                        priceHistory.length
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Price Change</p>
                    <p
                      className={`text-xl font-bold ${
                        priceHistory[priceHistory.length - 1]?.price >
                        priceHistory[0]?.price
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {(
                        ((priceHistory[priceHistory.length - 1]?.price -
                          priceHistory[0]?.price) /
                          priceHistory[0]?.price) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            )}

            {compareMode && compareItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Compare Multiple Items
                </h3>
                <p className="text-gray-600">
                  Select 2-3 items from the list to compare their price trends
                </p>
              </div>
            )}

            {compareMode && compareItems.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Price Comparison: {compareItems.length} Items
                </h3>
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
