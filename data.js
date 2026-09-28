window.FRONTIER_DATA = {
  inventory: {
    title: "Inventory disruption",
    subtitle: "Sense demand, rebalance inventory, and govern execution across every channel.",
    metrics: [
      {label:"Stores at risk of stockout", value:"38", change:"Within 18 hours", tone:"red"},
      {label:"Excess inventory", value:"4,820 units", change:"Across 21 stores", tone:"amber"},
      {label:"Revenue at risk", value:"$286K", change:"Next 72 hours", tone:"violet"},
      {label:"Fulfillment SLA", value:"91.2%", change:"Target 97.5%", tone:"blue"}
    ],
    insightTitle:"38 stores at risk of stockout while nearby stores hold excess supply",
    insightCopy:"Analyze the first policy-constrained transfer within the larger $286K disruption response."
  },
  promotion: {
    title:"Promotion event optimization",
    subtitle:"Coordinate pricing, inventory, suppliers, and fulfillment before demand becomes disruption.",
    metrics:[
      {label:"Forecast uplift", value:"+31%", change:"Confidence 89%", tone:"violet"},
      {label:"Stockout exposure", value:"17 SKUs", change:"Across 54 locations", tone:"red"},
      {label:"Margin opportunity", value:"$412K", change:"Seven-day event", tone:"amber"},
      {label:"Supplier capacity", value:"84%", change:"Three constraints", tone:"blue"}
    ],
    insightTitle:"Three promoted SKUs create 71% of projected stockout and margin exposure",
    insightCopy:"The proposed plan narrows discounts in constrained regions, advances supplier orders, and shifts digital fulfillment to inventory-rich nodes."
  }
};
