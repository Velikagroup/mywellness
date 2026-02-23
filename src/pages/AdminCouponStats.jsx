import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, TrendingUp, Users, CheckCircle2 } from 'lucide-react';

export default function AdminCouponStats() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchCode, setSearchCode] = useState('');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      setUser(currentUser);
      await loadData();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadData = async () => {
    try {
      const [couponsData, usersData] = await Promise.all([
        base44.entities.Coupon.list('-created_date', 500),
        base44.entities.User.list('-created_date', 10000)
      ]);
      setCoupons(couponsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  // Filter coupons by search
  const filteredCoupons = coupons.filter(c => 
    !searchCode || c.code.toUpperCase().includes(searchCode.toUpperCase())
  );

  // Map users by ID for quick lookup
  const usersById = Object.fromEntries(users.map(u => [u.id, u]));

  // Calculate stats for each coupon
  const couponStats = filteredCoupons.map(coupon => {
    const usedByUser = coupon.used_by ? usersById[coupon.used_by] : null;
    const hasConverted = usedByUser && 
      (usedByUser.subscription_status === 'active' || 
       usedByUser.subscription_status === 'trial');

    return {
      ...coupon,
      usedByUser,
      hasConverted: !!hasConverted
    };
  });

  const usedCoupons = couponStats.filter(c => c.used_by).length;
  const convertedCoupons = couponStats.filter(c => c.hasConverted).length;
  const conversionRate = usedCoupons > 0 
    ? ((convertedCoupons / usedCoupons) * 100).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Coupon Analytics</h1>
          <p className="text-gray-600">Traccia quali coupon vengono usati e quanti convertono</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Totale Coupon</p>
                  <p className="text-3xl font-black text-gray-900">{coupons.length}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Usati nel Quiz</p>
                  <p className="text-3xl font-black text-blue-600">{usedCoupons}</p>
                  <p className="text-xs text-gray-500 mt-1">{((usedCoupons / coupons.length) * 100).toFixed(0)}% del totale</p>
                </div>
                <ArrowRight className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Convertiti (Active/Trial)</p>
                  <p className="text-3xl font-black text-green-600">{convertedCoupons}</p>
                  <p className="text-xs text-gray-500 mt-1">di {usedCoupons} usati</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Tasso Conversione</p>
                  <p className="text-3xl font-black text-purple-600">{conversionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">quiz → pagamento</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div>
          <Input
            type="text"
            placeholder="Cerca coupon (es: DALILA, MARIO2024)..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="max-w-md h-10"
          />
        </div>

        {/* Table */}
        <Card className="water-glass-effect border-gray-200/30">
          <CardHeader>
            <CardTitle>Dettaglio Coupon ({filteredCoupons.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Codice</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Valore</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Usato da</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Data Uso</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Stato Utente</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Convertito?</th>
                  </tr>
                </thead>
                <tbody>
                  {couponStats.map(coupon => (
                    <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono font-semibold text-gray-900">{coupon.code}</td>
                      <td className="py-3 px-4 text-gray-600">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          coupon.discount_type === 'lifetime_free' 
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {coupon.discount_type === 'lifetime_free' ? 'Lifetime' : 'Percentuale'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {coupon.discount_type === 'lifetime_free' 
                          ? coupon.assigned_plan 
                          : `${coupon.discount_value}%`}
                      </td>
                      <td className="py-3 px-4">
                        {coupon.usedByUser ? (
                          <div className="text-sm">
                            <div className="font-semibold text-gray-900">{coupon.usedByUser.email}</div>
                            <div className="text-xs text-gray-500">{coupon.usedByUser.id}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Inutilizzato</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {coupon.used_at 
                          ? new Date(coupon.used_at).toLocaleDateString('it-IT')
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {coupon.usedByUser ? (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            coupon.usedByUser.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                            coupon.usedByUser.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {coupon.usedByUser.subscription_status}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {coupon.hasConverted ? (
                          <span className="text-green-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            ✅ Sì
                          </span>
                        ) : coupon.used_by ? (
                          <span className="text-orange-600 font-semibold">⏳ No (ancora)</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}