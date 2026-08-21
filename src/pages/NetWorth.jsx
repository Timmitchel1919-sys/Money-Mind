import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"
import PageHeader from "../components/PageHeader"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function NetWorth({
  assets,
  liabilities,
  assetName,
  setAssetName,
  assetValue,
  setAssetValue,
  liabilityName,
  setLiabilityName,
  liabilityValue,
  setLiabilityValue,
  handleAddAsset,
  handleAddLiability,
  handleDeleteAsset,
  handleDeleteLiability,
  rates,
  numberFormat,
  baseCurrency = "SRD",
}) {
  const totalAssets = assets.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const totalLiabilities = liabilities.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const netWorth = totalAssets - totalLiabilities

  return (
    <div className="space-y-6">
      <PageHeader pageKey="networth" />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          title="Total Assets"
          value={formatCurrencyAmount(totalAssets, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={totalAssets} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Total Liabilities"
          value={formatCurrencyAmount(totalLiabilities, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={totalLiabilities} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Net Worth"
          value={formatCurrencyAmount(netWorth, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={netWorth} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Assets">
          <form onSubmit={handleAddAsset} className="mt-6 space-y-4">
            <Input label="Asset Name" placeholder="Cash, Car, House..." value={assetName} onChange={setAssetName} />
            <Input label="Asset Value" type="number" placeholder="10000" value={assetValue} onChange={setAssetValue} />
            <button className="metallic-button w-full rounded-xl p-3 font-semibold text-black">
              Add Asset
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {assets.length === 0 ? (
              <p className="text-[#A5ADB8]">Nog geen assets toegevoegd.</p>
            ) : (
              assets.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-[#A5ADB8]">Asset</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#34D399]">SRD {Number(item.value).toFixed(2)}</p>
                    <button onClick={() => handleDeleteAsset(item.id)} className="mt-2 text-sm text-red-400 hover:text-red-300">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Liabilities">
          <form onSubmit={handleAddLiability} className="mt-6 space-y-4">
            <Input label="Liability Name" placeholder="Loan, Debt, Credit..." value={liabilityName} onChange={setLiabilityName} />
            <Input label="Liability Value" type="number" placeholder="5000" value={liabilityValue} onChange={setLiabilityValue} />
            <button className="metallic-button w-full rounded-xl p-3 font-semibold text-black">
              Add Liability
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {liabilities.length === 0 ? (
              <p className="text-[#A5ADB8]">Nog geen liabilities toegevoegd.</p>
            ) : (
              liabilities.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-[#A5ADB8]">Liability</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#F87171]">SRD {Number(item.value).toFixed(2)}</p>
                    <button onClick={() => handleDeleteLiability(item.id)} className="mt-2 text-sm text-red-400 hover:text-red-300">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </section>
    </div>
  )
}