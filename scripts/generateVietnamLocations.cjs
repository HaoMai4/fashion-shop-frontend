const fs = require('fs');
const path = require('path');

const API_URL = 'https://provinces.open-api.vn/api/v1/?depth=3';

function normalizeProvinceName(item) {
  return item.name || '';
}

function normalizeDistrictName(item) {
  return item.name || '';
}

function normalizeWardName(item) {
  return item.name || '';
}

async function main() {
  console.log('Fetching Vietnam location data...');

  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
  }

  const rawData = await response.json();

  const vietnamLocations = rawData.map((province) => ({
    name: normalizeProvinceName(province),
    districts: (province.districts || []).map((district) => ({
      name: normalizeDistrictName(district),
      wards: (district.wards || []).map((ward) => ({
        name: normalizeWardName(ward),
      })),
    })),
  }));

  const fileContent = `export type VietnamWard = {
  name: string;
};

export type VietnamDistrict = {
  name: string;
  wards: VietnamWard[];
};

export type VietnamProvince = {
  name: string;
  districts: VietnamDistrict[];
};

export const vietnamLocations: VietnamProvince[] = ${JSON.stringify(vietnamLocations, null, 2)};
`;

  const outputPath = path.resolve(__dirname, '../src/data/vietnamLocations.ts');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, fileContent, 'utf8');

  const districtCount = vietnamLocations.reduce(
    (sum, province) => sum + province.districts.length,
    0
  );

  const wardCount = vietnamLocations.reduce(
    (sum, province) =>
      sum +
      province.districts.reduce(
        (districtSum, district) => districtSum + district.wards.length,
        0
      ),
    0
  );

  console.log('Generated src/data/vietnamLocations.ts');
  console.log(`Provinces: ${vietnamLocations.length}`);
  console.log(`Districts: ${districtCount}`);
  console.log(`Wards: ${wardCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});