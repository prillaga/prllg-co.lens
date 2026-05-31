export const STORAGE_KEY = "prillaga:catalog:v1";

export const SEED_CATALOG = {
  updatedAt: Date.now(),
  settings: {
    reservationFee: 100,
    longRateMinDays: 3,
    currency: "PHP"
  },
  units: [
    {
      id: "nikon-kit",
      name: "Nikon DSLR Flipscreen w/ kitlens 15-80mm",
      description: "",
      image: "images/nikon-kitlens.jpg",
      images: ["images/nikon-kitlens.jpg"],
      pricing: { baseRate: 450, longRate: 400, longRateMinDays: 3 },
      sortOrder: 1,
      active: true,
      bookable: true
    },
    {
      id: "nikon-zoom",
      name: "Nikon DSLR Flipscreen w/ Zoom Lens 70-300mm",
      description: "",
      image: "images/nikon-zoomlens.jpg",
      images: ["images/nikon-zoomlens.jpg"],
      pricing: { baseRate: 550, longRate: 500, longRateMinDays: 3 },
      sortOrder: 2,
      active: true,
      bookable: true
    },
    {
      id: "nikon-zoom-kit-battery",
      name: "Nikon DSLR w/ Zoom Lens + Kitlens + Extra battery",
      description: "",
      image: "images/nikon-zoom-kit-battery.jpg",
      images: ["images/nikon-zoom-kit-battery.jpg"],
      pricing: { baseRate: 950, longRate: 900, longRateMinDays: 3 },
      sortOrder: 3,
      active: true,
      bookable: true
    },
    {
      id: "canon-1200d",
      name: "Canon 1200D DSLR w/ kitlens 18-55mm",
      description: "",
      image: "images/canon-1200d.jpg",
      images: ["images/canon-1200d.jpg"],
      pricing: { baseRate: 550, longRate: 500, longRateMinDays: 3 },
      sortOrder: 4,
      active: true,
      bookable: true
    },
    {
      id: "canon-4000d",
      name: "Canon 4000D DSLR w/ kitlens 18-55mm",
      description: "",
      image: "images/canon-4000d.jpg",
      images: ["images/canon-4000d.jpg"],
      pricing: { baseRate: 550, longRate: 500, longRateMinDays: 3 },
      sortOrder: 5,
      active: true,
      bookable: true
    },
    {
      id: "g6-thumb",
      name: "G6 THUMB CAMERA",
      description: "",
      image: "images/G6-thumb-camera.jpg",
      images: ["images/G6-thumb-camera.jpg"],
      pricing: { baseRate: 200, longRate: 150, longRateMinDays: 3 },
      sortOrder: 6,
      active: true,
      bookable: true
    },
    {
      id: "kodak-v603",
      name: "Kodak EasyShare V603",
      description: "",
      image: "images/kodak-v603.jpg",
      images: ["images/kodak-v603.jpg"],
      pricing: { baseRate: 250, longRate: 200, longRateMinDays: 3 },
      sortOrder: 7,
      active: true,
      bookable: true
    },
    {
      id: "zoom-lens",
      name: "Zoom Lens 70-300mm",
      description: "",
      image: "images/zoom lens.jpg",
      images: ["images/zoom lens.jpg"],
      pricing: { baseRate: 300, longRate: 250, longRateMinDays: 3 },
      sortOrder: 8,
      active: true,
      bookable: true
    },
    {
      id: "dji-gimbal",
      name: "DJI OSMO MOBILE 3 GIMBAL",
      description: "",
      image: "images/dji-osmo.jpg",
      images: ["images/dji-osmo.jpg"],
      pricing: { baseRate: 300, longRate: 250, longRateMinDays: 3 },
      sortOrder: 9,
      active: true,
      bookable: true
    }
  ],
  addons: [
    { id: "extra-battery", name: "Extra Battery", label: "Extra Battery ₱100", price: 100, sortOrder: 1, active: true },
    { id: "zoom-lens-addon", name: "Zoom Lens", label: "Zoom Lens ₱300", price: 300, sortOrder: 2, active: true }
  ],
  media: []
};

export const VALID_UNIT_IDS = new Set(SEED_CATALOG.units.map(function (u) { return u.id; }));
