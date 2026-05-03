import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Customer } from '../../types';
import { formatINR } from '../../lib/utils';
import { User } from 'lucide-react';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const custs: Customer[] = [];
      snapshot.forEach((doc) => {
        custs.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(custs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
       <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif">Customers</h1>
       </div>

       {loading ? (
         <p className="text-zinc-500">Loading customers...</p>
       ) : (
         <div className="bg-white border border-zinc-200 overflow-hidden">
           <table className="w-full text-left text-sm">
             <thead className="bg-zinc-50 border-b border-zinc-200">
               <tr>
                 <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[10px]">Customer</th>
                 <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[10px]">Total Orders</th>
                 <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[10px]">Total Spent</th>
                 <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[10px]">Joined</th>
               </tr>
             </thead>
             <tbody>
               {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No customers found.</td>
                  </tr>
               )}
               {customers.map((customer) => (
                 <tr key={customer.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
                            <User size={18} />
                         </div>
                         <div>
                            {customer.name && <p className="font-medium">{customer.name}</p>}
                            <p className="text-zinc-500 text-xs">{customer.email}</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-6 py-4 font-medium">{customer.totalOrders}</td>
                   <td className="px-6 py-4 font-medium text-green-600">{formatINR(customer.totalSpent)}</td>
                   <td className="px-6 py-4 text-zinc-500">{customer.createdAt?.toDate ? customer.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       )}
    </div>
  );
}
