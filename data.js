window.FRONTIER_DATA = {
  inventory: {
    title: "Inventory disruption",
    subtitle: "Sense demand, rebalance inventory, and govern execution across every channel.",
    metrics: [
      {label:"Stockout risk", value:"38 stores", change:"Within 18 hours", tone:"red"},
      {label:"Excess inventory", value:"4,820 units", change:"Across 21 stores", tone:"amber"},
      {label:"Revenue at risk", value:"$286K", change:"Next 72 hours", tone:"violet"},
      {label:"Fulfillment SLA", value:"91.2%", change:"Target 97.5%", tone:"blue"}
    ],
    steps: [
      {name:"Detect demand shift", owner:"Demand Signal Agent", type:"system", time:"Real time"},
      {name:"Build inventory graph", owner:"Inventory Agent", type:"system", time:"42 sec"},
      {name:"Simulate allocations", owner:"Allocation Agent", type:"system", time:"2.4 min"},
      {name:"Challenge plan", owner:"Risk Agent", type:"system", time:"38 sec", risk:true},
      {name:"Approve transfer", owner:"Regional operator", type:"human", time:"6 min"},
      {name:"Execute and monitor", owner:"Execution Agent", type:"system", time:"Continuous"}
    ],
    insightTitle:"A regional demand spike will create 38 stockouts while nearby stores hold excess supply",
    insightCopy:"The proposed plan rebalances 1,240 units, protects an estimated $184K in margin, and maintains safety stock without emergency procurement.",
    models: [
      {id:"assist", label:"Conservative", title:"Planner-led response", tag:"Lowest disruption", cycle:"9.6 hours", effort:"12 actions", cost:"$34K", risk:"Low", autonomy:26, desc:"Agents assemble signals and options. Planners approve every transfer and replenishment action."},
      {id:"balanced", label:"Recommended", title:"Agent-led rebalancing", tag:"Best value-to-risk", cycle:"11 minutes", effort:"1 approval", cost:"$8K", risk:"Controlled", autonomy:72, desc:"Agents simulate and execute within policy. Material margin or supplier impacts require accountable approval."},
      {id:"autonomous", label:"Frontier", title:"Continuous autonomous flow", tag:"Maximum velocity", cycle:"3 minutes", effort:"Exceptions", cost:"$4K", risk:"Elevated", autonomy:93, desc:"Agents continuously rebalance inventory and fulfillment, escalating only novel or high-impact decisions."}
    ],
    simulation:[
      ["Demand Signal", "Demand spike detected for SKU-482 across Northeast digital channels", "agent", "forecast-model", "A2A task created"],
      ["Inventory Agent", "Store, DC, in-transit, and safety-stock positions reconciled", "agent", "fast-model + tools", "A2A artifact returned"],
      ["Allocation Agent", "Six transfer plans simulated against margin and SLA", "agent", "reasoning-model", "Candidate plan proposed"],
      ["Risk & Governance", "Plan challenged for weather, labor, and minimum-stock constraints", "agent", "independent-judge", "Control opinion returned"],
      ["Regional operator", "High-value interstate transfer approved", "human", "deterministic-policy", "Approval gate satisfied"],
      ["Execution Agent", "Transfers issued; fulfillment promises and telemetry updated", "agent", "policy-bound-tools", "Workflow completed"]
    ]
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
    steps:[
      {name:"Ingest promotion", owner:"Merchandising systems", type:"system", time:"Real time"},
      {name:"Forecast response", owner:"Demand Signal Agent", type:"system", time:"1.8 min"},
      {name:"Stress-test supply", owner:"Inventory Agent", type:"system", time:"52 sec"},
      {name:"Optimize offer", owner:"Allocation Agent", type:"system", time:"2.1 min", risk:true},
      {name:"Approve guardrails", owner:"Merchandising lead", type:"human", time:"4 min"},
      {name:"Launch and adapt", owner:"Execution Agent", type:"system", time:"Continuous"}
    ],
    insightTitle:"Three promoted SKUs create 71% of projected stockout and margin exposure",
    insightCopy:"The proposed plan narrows discounts in constrained regions, advances supplier orders, and shifts digital fulfillment to inventory-rich nodes.",
    models:[
      {id:"assist", label:"Conservative", title:"Merchandiser-led planning", tag:"Lowest disruption", cycle:"2.4 days", effort:"16 actions", cost:"$76K", risk:"Low", autonomy:24, desc:"Agents prepare forecasts and recommendations while merchandising retains every decision."},
      {id:"balanced", label:"Recommended", title:"Agent-coordinated event", tag:"Best value-to-risk", cycle:"18 minutes", effort:"2 approvals", cost:"$19K", risk:"Controlled", autonomy:69, desc:"Agents coordinate demand, supply, pricing, and fulfillment within approved commercial guardrails."},
      {id:"autonomous", label:"Frontier", title:"Adaptive promotion network", tag:"Maximum velocity", cycle:"5 minutes", effort:"Exceptions", cost:"$9K", risk:"Elevated", autonomy:91, desc:"Agents continuously tune offers and allocation using observed demand and margin performance."}
    ],
    simulation:[
      ["Demand Signal", "Promotion response forecast generated by SKU, store, and channel", "agent", "forecast-model", "A2A task created"],
      ["Inventory Agent", "Constrained supply and substitution graph assembled", "agent", "fast-model + tools", "A2A artifact returned"],
      ["Allocation Agent", "Price, placement, and fulfillment options optimized", "agent", "reasoning-model", "Candidate plan proposed"],
      ["Risk & Governance", "Consumer fairness and margin guardrails evaluated", "agent", "independent-judge", "Control opinion returned"],
      ["Merchandising lead", "Regional pricing exception approved", "human", "deterministic-policy", "Approval gate satisfied"],
      ["Execution Agent", "Offer launched with continuous demand adaptation", "agent", "policy-bound-tools", "Workflow completed"]
    ]
  }
};
