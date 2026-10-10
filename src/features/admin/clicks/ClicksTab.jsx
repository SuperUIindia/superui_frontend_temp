import React from 'react';
import TableScrollArea from '../../../components/TableScrollArea';

export default function ClicksTab({ clicksData, loadingClicks }) {
  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#111111]">
            Service Card Interactions
          </h3>
          <p className="text-xs text-[#6B6B6B]">
            Aggregated click telemetry grouped by specific service offering
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm overflow-hidden">
        <TableScrollArea>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#EDEDED] text-[#6B6B6B] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Total Clicks</th>
                <th className="py-3 px-4">Last Clicked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED]">
              {loadingClicks ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-[#6B6B6B]">
                    <div className="inline-block w-5 h-5 border-2 border-[#FF5E00] border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading clicks data...</p>
                  </td>
                </tr>
              ) : clicksData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-xs text-[#6B6B6B]">
                    No card click interactions recorded yet. Click service cards on the home page to record telemetry.
                  </td>
                </tr>
              ) : (
                clicksData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#111111]">
                      {item.service}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#FF5E00] text-sm">
                        {item.count}
                      </span>{' '}
                      clicks
                    </td>
                    <td className="py-3 px-4 text-[#71717A]">
                      {item.lastClicked
                        ? new Date(item.lastClicked).toLocaleString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableScrollArea>
      </div>
    </div>
  );
}

