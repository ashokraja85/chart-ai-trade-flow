
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OptionChainProps {
  symbol: string;
}

export const OptionChain = ({ symbol }: OptionChainProps) => {
  const optionData = [
    { strike: 19600, callOI: 45780, callLTP: 89.5, callChange: +5.2, putOI: 67890, putLTP: 15.3, putChange: -2.1 },
    { strike: 19650, callOI: 123456, callLTP: 52.8, callChange: +3.1, putOI: 98765, putLTP: 28.7, putChange: -1.8 },
    { strike: 19700, callOI: 234567, callLTP: 25.4, callChange: +1.9, putOI: 156789, putLTP: 48.9, putChange: +2.3, isATM: true },
    { strike: 19750, callOI: 87654, callLTP: 12.1, callChange: -0.8, putOI: 134567, putLTP: 78.2, putChange: +4.1 },
    { strike: 19800, callOI: 34567, callLTP: 5.7, callChange: -1.2, putOI: 78901, putLTP: 115.6, putChange: +6.8 },
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">{symbol} Option Chain</CardTitle>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>Expiry: 30 Nov 2023</span>
          <Badge variant="outline" className="border-blue-600 text-blue-400">ATM: 19700</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-2 text-slate-400">Call OI</th>
                <th className="text-right p-2 text-slate-400">Call LTP</th>
                <th className="text-center p-2 text-slate-400 font-bold">Strike</th>
                <th className="text-left p-2 text-slate-400">Put LTP</th>
                <th className="text-right p-2 text-slate-400">Put OI</th>
              </tr>
            </thead>
            <tbody>
              {optionData.map((row) => (
                <tr 
                  key={row.strike} 
                  className={`border-b border-slate-700 hover:bg-slate-700 ${
                    row.isATM ? 'bg-slate-700' : ''
                  }`}
                >
                  <td className="p-2 text-slate-300">{row.callOI.toLocaleString()}</td>
                  <td className="p-2 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-white font-medium">{row.callLTP}</span>
                      <span className={`text-xs ${row.callChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {row.callChange > 0 ? '+' : ''}{row.callChange}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <span className={`font-bold ${row.isATM ? 'text-yellow-400' : 'text-white'}`}>
                      {row.strike}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{row.putLTP}</span>
                      <span className={`text-xs ${row.putChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {row.putChange > 0 ? '+' : ''}{row.putChange}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-right text-slate-300">{row.putOI.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-center gap-2">
          <Button size="sm" variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-green-600">
            Buy Call
          </Button>
          <Button size="sm" variant="outline" className="bg-red-600 hover:bg-red-700 text-white border-red-600">
            Buy Put
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
