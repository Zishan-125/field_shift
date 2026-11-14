
import React from "react";

interface EarthObservationContextProps {
  data: unknown;
  language?: "bn" | "en";
}

type ObservationRow = Record<string, unknown>;

const finite = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);

  if (!Number.isFinite(number) || number === -999) return null;

  return number;
};

const getRows = (input: unknown): ObservationRow[] => {
  let current = input;

  for (let i = 0; i < 6; i++) {
    if (Array.isArray(current)) {
      return current.filter(
        (item): item is ObservationRow =>
          typeof item === "object" && item !== null
      );
    }

    if (typeof current !== "object" || current === null) {
      return [];
    }

    const object = current as Record<string, unknown>;

    const nested = [
      object.data,
      object.environment,
      object.rows,
      object.results,
      object.observations,
    ].find(
      (value) =>
        Array.isArray(value) ||
        (typeof value === "object" && value !== null)
    );

    if (nested === undefined) {
      return [object];
    }

    current = nested;
  }

  return [];
};

const firstFinite = (
  row: ObservationRow,
  keys: string[]
): number | null => {
  for (const key of keys) {
    const value = finite(row[key]);
    if (value !== null) return value;
  }

  return null;
};

const getLatestDate = (row: ObservationRow): string => {
  const value =
    row.observation_date ??
    row.date ??
    row.timestamp ??
    row.datetime;

  if (value === null || value === undefined) return "N/A";

  const text = String(value);

  if (/^\d{8}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) return text;

  return parsed.toLocaleDateString();
};

const formatValue = (
  value: number | null,
  unit: string,
  decimals = 2
): string => {
  if (value === null) return "N/A";

  return `${value.toFixed(decimals)} ${unit}`;
};

const ObservationCard = ({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
}) => (
  <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {title}
        </h4>
        <span className="text-xl" aria-hidden="true">
          {icon}
        </span>
      </div>

      <p className="text-2xl font-black text-slate-900">
        {value}
      </p>
    </div>

    <p className="mt-2 text-xs leading-relaxed text-slate-500">
      {description}
    </p>
  </div>
);

const EarthObservationContext: React.FC<
  EarthObservationContextProps
> = ({ data, language = "en" }) => {
  const rows = getRows(data);
  const latest = rows.length > 0 ? rows[rows.length - 1] : {};

  const isBangla = language === "bn";

  const temperature = firstFinite(latest, [
    "power_temperature_mean",
    "temperature",
    "temperature_c",
    "t2m",
  ]);

  const rainfall = firstFinite(latest, [
    "ag_rainfall_mm",
    "power_precipitation",
    "precipitation",
    "rainfall",
  ]);

  const wind = firstFinite(latest, [
    "power_wind_speed",
    "wind_speed",
    "ws2m",
  ]);

  const solar = firstFinite(latest, [
    "power_solar_radiation",
    "solar_radiation",
    "allsky_sfc_sw_dwn",
  ]);

  const descriptions = {
    temperature: isBangla
      ? "নির্বাচিত অবস্থানের দৈনিক গড় তাপমাত্রা।"
      : "Daily mean temperature for the selected location.",

    rainfall: isBangla
      ? "নির্বাচিত অবস্থানের দৈনিক বৃষ্টিপাত।"
      : "Daily precipitation for the selected location.",

    wind: isBangla
      ? "নির্বাচিত অবস্থানের ২ মিটার উচ্চতায় দৈনিক বাতাসের গতি।"
      : "Daily wind speed at 2 metres for the selected location.",

    solar: isBangla
      ? "নির্বাচিত অবস্থানের দৈনিক সৌর বিকিরণ।"
      : "Daily solar radiation for the selected location.",
  };

  const sourceDetails = [
    ["NASA POWER — T2M", isBangla ? "তাপমাত্রা (°C)" : "Temperature (°C)"],
    [
      "NASA POWER — PRECTOTCORR",
      isBangla ? "বৃষ্টিপাত (mm/day)" : "Precipitation (mm/day)",
    ],
    [
      "NASA POWER — WS2M",
      isBangla ? "২ মিটার উচ্চতায় বাতাসের গতি (m/s)" : "Wind speed at 2 metres (m/s)",
    ],
    [
      "NASA POWER — ALLSKY_SFC_SW_DWN",
      isBangla ? "সৌর বিকিরণ (kWh/m²/day)" : "Solar radiation (kWh/m²/day)",
    ],
  ];

  return (
    <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-600">
            {isBangla ? "NASA POWER ডেটা" : "NASA POWER Data"}
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
            {isBangla
              ? "পৃথিবী পর্যবেক্ষণ তথ্য"
              : "Earth Observation Context"}
          </h3>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            {isBangla
              ? "নির্বাচিত কৃষিজমির পরিবেশগত অবস্থা এবং NASA POWER পর্যবেক্ষণ।"
              : "Detailed field environment. NASA and NASA POWER observations are shown as environmental context for the field."}
          </p>
        </div>

        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-green-800">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {isBangla ? "NASA POWER ডেটা" : "NASA POWER Data"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ObservationCard
          title={isBangla ? "তাপমাত্রা" : "Temperature"}
          value={formatValue(temperature, "°C")}
          description={descriptions.temperature}
          icon="🌡️"
        />

        <ObservationCard
          title={isBangla ? "বৃষ্টিপাত" : "Rainfall"}
          value={formatValue(rainfall, "mm")}
          description={descriptions.rainfall}
          icon="🌧️"
        />

        <ObservationCard
          title={isBangla ? "বাতাসের গতি" : "Wind Speed"}
          value={formatValue(wind, "m/s")}
          description={descriptions.wind}
          icon="💨"
        />

        <ObservationCard
          title={isBangla ? "সৌর বিকিরণ" : "Solar Radiation"}
          value={formatValue(solar, "kWh/m²/day")}
          description={descriptions.solar}
          icon="☀️"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">
            {isBangla ? "সর্বশেষ পর্যবেক্ষণের তারিখ" : "Latest Observation"}
          </p>

          <p className="mt-1 text-lg font-black text-slate-900">
            {getLatestDate(latest)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">
            {isBangla ? "মোট পর্যবেক্ষণ" : "Available Observations"}
          </p>

          <p className="mt-1 text-lg font-black text-slate-900">
            {rows.length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <h4 className="mb-3 text-sm font-black text-slate-900">
          {isBangla ? "ডেটা উৎস ও প্যারামিটার" : "Data Sources and Parameters"}
        </h4>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sourceDetails.map(([source, detail]) => (
            <div
              key={source}
              className="flex flex-col gap-1 rounded-xl border border-slate-200/80 bg-white p-3"
            >
              <span className="text-xs font-black text-slate-800">
                {source}
              </span>

              <span className="text-xs text-slate-500">
                {detail}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          {isBangla
            ? "NASA POWER দৈনিক পর্যবেক্ষণ প্রকাশে বিলম্ব হতে পারে। তাই সর্বশেষ উপলভ্য তারিখের তথ্য দেখানো হয়; এটি তাৎক্ষণিক আবহাওয়ার তথ্য নয়।"
            : "NASA POWER daily observations may have a publication delay. This section displays the latest available observation, not instantaneous real-time weather."}
        </p>
      </div>
    </section>
  );
};

export default EarthObservationContext;
