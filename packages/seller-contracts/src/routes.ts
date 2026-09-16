export type RouteNode = {
  path: string;
  label?: string;
  children?: RouteNode[];
};

export const routeTree: RouteNode[] = [
  {
    path: "",
    label: "Home",
    children: [
      {
        path: "products",
        label: "Products",
        children: [
          { path: "new", label: "New Product" },
          {
            path: ":productId",
            label: "Edit Product",
            children: [
              {
                path: "variants",
                label: "Variants",
                children: [{ path: ":variantId", label: "Edit Variant" }],
              },
            ],
          },
        ],
      },
      {
        path: "inventory",
        label: "Inventory",
        children: [
          {
            path: "locations",
            label: "Locations",
            children: [
              { path: "new", label: "New Location" },
              {
                path: ":locationId",
                label: "Edit Location",
                children: [
                  {
                    path: "zones",
                    label: "Zones",
                    children: [
                      { path: "new", label: "New Zone" },
                      {
                        path: ":zoneId",
                        label: "Edit Zone",
                        children: [
                          {
                            path: "bins/new",
                            label: "New Bin",
                          },
                          {
                            path: "bins/:binId",
                            label: "Edit Bin",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            path: "stocks",
            label: "Stock",
            children: [
              { path: "new", label: "New Stock Item" },
              { path: "coverage", label: "Coverage" },
              { path: ":itemId", label: "Stock Item" },
            ],
          },
        ],
      },
      { path: "login", label: "Login" },
      { path: "register", label: "Register" },
      { path: "contexts", label: "Contexts" },
      { path: "individual", label: "Individual Onboarding" },
      { path: "retailer", label: "Retailer Onboarding" },
    ],
  },
];

export const routes = {
  home: "",
  login: "login",
  register: "register",
  contextSelection: "contexts",
  individualOnboarding: "individual",
  retailerOnboarding: "retailer",

  // Products
  products: "products",
  newProduct: "products/new",
  editProduct: (id: string) => `products/${id}`,
  editProductVariant: (productId: string, variantId: string) =>
    `products/${productId}/variants/${variantId}`,

  // Inventory
  inventory: "inventory",
  locations: "inventory/locations",
  newLocation: "inventory/locations/new",
  editLocation: (locationId: string) => `inventory/locations/${locationId}`,
  zones: (locationId: string) => `inventory/locations/${locationId}/zones`,
  newZone: (locationId: string) => `inventory/locations/${locationId}/zones/new`,
  editZone: (locationId: string, zoneId: string) =>
    `inventory/locations/${locationId}/zones/${zoneId}`,
  newBin: (locationId: string, zoneId: string) =>
    `inventory/locations/${locationId}/zones/${zoneId}/bins/new`,
  editBin: (locationId: string, zoneId: string, binId: string) =>
    `inventory/locations/${locationId}/zones/${zoneId}/bins/${binId}`,

  stock: "inventory/stocks",
  newStockItem: "inventory/stocks/new",
  stockItem: (itemId: string) => `inventory/stocks/${itemId}`,
  stockCoverage: "inventory/stocks/coverage",
} as const;
