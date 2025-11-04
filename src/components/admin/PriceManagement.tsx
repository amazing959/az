import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { supabase, Item, Price } from '../../lib/supabase';

interface PriceWithItem extends Price {
  items?: Item;
}

export default function PriceManagement() {
  const [prices, setPrices] = useState<PriceWithItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceWithItem | null>(null);
  const [formData, setFormData] = useState({
    item_id: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, pricesRes] = await Promise.all([
        supabase.from('items').select('*').order('name'),
        supabase
          .from('prices')
          .select('*, items(*)')
          .order('date', { ascending: false })
          .limit(50),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (pricesRes.error) throw pricesRes.error;

      setItems(itemsRes.data || []);
      setPrices(pricesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPrice) {
        const { error } = await supabase
          .from('prices')
          .update({
            item_id: formData.item_id,
            price: parseFloat(formData.price),
            date: formData.date,
          })
          .eq('id', editingPrice.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('prices').insert({
          item_id: formData.item_id,
          price: parseFloat(formData.price),
          date: formData.date,
        });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingPrice(null);
      setFormData({
        item_id: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (error) {
      console.error('Error saving price:', error);
      alert('Failed to save price');
    }
  };

  const handleEdit = (price: PriceWithItem) => {
    setEditingPrice(price);
    setFormData({
      item_id: price.item_id,
      price: price.price.toString(),
      date: price.date,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price record?')) return;

    try {
      const { error } = await supabase.from('prices').delete().eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting price:', error);
      alert('Failed to delete price');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPrice(null);
    setFormData({
      item_id: '',
      price: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const generateMockPrices = async () => {
    if (!confirm('Generate 7 days of mock price data for all items?')) return;

    try {
      const today = new Date();
      const mockData = [];

      for (const item of items) {
        const basePrice = Math.floor(Math.random() * 100) + 50;

        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const variance = (Math.random() - 0.5) * 20;
          const price = Math.max(20, basePrice + variance);

          mockData.push({
            item_id: item.id,
            price: parseFloat(price.toFixed(2)),
            date: date.toISOString().split('T')[0],
          });
        }
      }

      const { error } = await supabase.from('prices').insert(mockData);

      if (error) throw error;
      loadData();
      alert('Mock prices generated successfully!');
    } catch (error) {
      console.error('Error generating mock prices:', error);
      alert('Failed to generate mock prices');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading prices...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Price Management</h2>
          <p className="text-gray-600 mt-1">Manage daily market rates for items</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateMockPrices}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Generate Mock Data</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add Price</span>
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price (PKR/kg)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prices.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No prices found. Add price records or generate mock data.
                </td>
              </tr>
            ) : (
              prices.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {price.items?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rs. {price.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(price.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(price)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(price.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPrice ? 'Edit Price' : 'Add New Price'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select
                  value={formData.item_id}
                  onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select an item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (PKR per kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 150.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingPrice ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
