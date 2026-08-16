export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Order = {
  id?: number;
  version?: number;
  status?: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  name: string;
  nameAr?: string;
  time: string;
  from: string;
  fromAr?: string;
  to: string;
  toAr?: string;
  fromCoordinate: Coordinate;
  toCoordinate: Coordinate;
};

export type MovementRequest = {
  id: number;
  request_number: string;
  scheduled_at: string | null;
  pickup: { label: string; lat: number; lng: number };
  dropoff: { label: string; lat: number; lng: number };
  passenger_names: string;
  vehicle_label: string;
  notes: string | null;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  version: number;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

const movementStatuses = new Set<MovementRequest['status']>(['assigned', 'in_progress', 'completed', 'cancelled']);

export function isMovementRequest(value: unknown): value is MovementRequest {
  if (!value || typeof value !== 'object') return false;
  const request = value as Record<string, unknown>;
  const validPoint = (point: unknown) => {
    if (!point || typeof point !== 'object') return false;
    const candidate = point as Record<string, unknown>;
    return typeof candidate.label === 'string' && typeof candidate.lat === 'number' && Number.isFinite(candidate.lat) && typeof candidate.lng === 'number' && Number.isFinite(candidate.lng);
  };
  return Number.isInteger(request.id) && Number.isInteger(request.version) && typeof request.request_number === 'string' && typeof request.passenger_names === 'string' && typeof request.vehicle_label === 'string' && (request.notes === null || typeof request.notes === 'string') && (request.scheduled_at === null || typeof request.scheduled_at === 'string') && (request.started_at === null || typeof request.started_at === 'string') && (request.completed_at === null || typeof request.completed_at === 'string') && typeof request.updated_at === 'string' && typeof request.status === 'string' && movementStatuses.has(request.status as MovementRequest['status']) && validPoint(request.pickup) && validPoint(request.dropoff);
}

const atlanta = {
  howellMill: { latitude: 33.8107, longitude: -84.4307 },
  peachtree: { latitude: 33.8461, longitude: -84.3676 },
  lenox: { latitude: 33.8469, longitude: -84.3621 },
  buckhead: { latitude: 33.8521, longitude: -84.3617 },
  piedmont: { latitude: 33.7851, longitude: -84.3738 },
  midtown: { latitude: 33.7817, longitude: -84.3831 },
  atlantic: { latitude: 33.7925, longitude: -84.3962 },
  westEnd: { latitude: 33.7357, longitude: -84.4132 },
  ponce: { latitude: 33.7726, longitude: -84.3658 },
  virginiaHighland: { latitude: 33.804, longitude: -84.3538 },
  battery: { latitude: 33.8908, longitude: -84.4678 },
  sandySprings: { latitude: 33.9304, longitude: -84.3733 },
  grantPark: { latitude: 33.738, longitude: -84.3701 },
  inmanPark: { latitude: 33.7595, longitude: -84.3538 },
  airport: { latitude: 33.6407, longitude: -84.4277 },
  downtown: { latitude: 33.749, longitude: -84.388 },
  cumberland: { latitude: 33.8839, longitude: -84.4717 },
  vinings: { latitude: 33.8648, longitude: -84.464 },
  oldFourthWard: { latitude: 33.7676, longitude: -84.368 },
  decatur: { latitude: 33.7748, longitude: -84.2963 },
  brookhaven: { latitude: 33.8651, longitude: -84.3366 },
  eastPoint: { latitude: 33.6796, longitude: -84.4394 },
  marietta: { latitude: 33.9526, longitude: -84.5499 },
  smyrna: { latitude: 33.8839, longitude: -84.5144 },
  littleFive: { latitude: 33.7634, longitude: -84.3628 },
};

export const ASSIGNED: Order[] = [
  { name: 'ahmed Smith', nameAr: 'أليكس سميث', time: '18:00', from: 'Girne American University, Karaoğlanoğlu', fromAr: 'جامعة جيرنه الأمريكية، كارا أوغلان أوغلو', to: 'Kyrenia Harbour, Girne', toAr: 'ميناء كيرينيا، جيرنه', fromCoordinate: { latitude: 35.3487, longitude: 33.2924 }, toCoordinate: { latitude: 35.3417, longitude: 33.3192 } },
  { name: 'Sarah Johnson', nameAr: 'سارة جونسون', time: '20:30', from: '2400 Peachtree Rd', fromAr: 'طريق بيتشتري 2400', to: 'Sarah Johnson', toAr: 'سارة جونسون', fromCoordinate: atlanta.peachtree, toCoordinate: atlanta.buckhead },
  { name: 'Michael Brown', nameAr: 'مايكل براون', time: '21:15', from: 'Lenox Square', fromAr: 'ساحة لينوكس', to: 'Buckhead Village', toAr: 'قرية باكهيد', fromCoordinate: atlanta.lenox, toCoordinate: atlanta.buckhead },
  { name: 'Emma Wilson', nameAr: 'إيما ويلسون', time: '21:45', from: 'Piedmont Park', fromAr: 'حديقة بيدمونت', to: 'Midtown Atlanta', toAr: 'وسط أتلانتا', fromCoordinate: atlanta.piedmont, toCoordinate: atlanta.midtown },
  { name: 'James Davis', nameAr: 'جيمس ديفيس', time: '22:10', from: 'Atlantic Station', fromAr: 'محطة أتلانتيك', to: 'West End Mall', toAr: 'مركز ويست إند', fromCoordinate: atlanta.atlantic, toCoordinate: atlanta.westEnd },
  { name: 'Olivia Martin', nameAr: 'أوليفيا مارتن', time: '22:30', from: 'Ponce City Market', fromAr: 'سوق بونس سيتي', to: 'Virginia Highland', toAr: 'فيرجينيا هايلاند', fromCoordinate: atlanta.ponce, toCoordinate: atlanta.virginiaHighland },
  { name: 'Daniel Taylor', nameAr: 'دانيال تايلور', time: '22:50', from: 'The Battery Atlanta', fromAr: 'ذا باتري أتلانتا', to: 'Sandy Springs', toAr: 'ساندي سبرينغز', fromCoordinate: atlanta.battery, toCoordinate: atlanta.sandySprings },
  { name: 'Sophia Anderson', nameAr: 'صوفيا أندرسون', time: '23:10', from: 'Grant Park', fromAr: 'حديقة غرانت', to: 'Inman Park', toAr: 'إنمان بارك', fromCoordinate: atlanta.grantPark, toCoordinate: atlanta.inmanPark },
  { name: 'Noah Thomas', nameAr: 'نواه توماس', time: '23:30', from: 'Hartsfield Airport', fromAr: 'مطار هارتسفيلد', to: 'Downtown Atlanta', toAr: 'وسط أتلانتا', fromCoordinate: atlanta.airport, toCoordinate: atlanta.downtown },
  { name: 'Mia Jackson', nameAr: 'ميا جاكسون', time: '23:50', from: 'Cumberland Mall', fromAr: 'مركز كمبرلاند', to: 'Vinings', toAr: 'فاينينغز', fromCoordinate: atlanta.cumberland, toCoordinate: atlanta.vinings },
];

export function localizeOrder(order: Order, language: string): Order {
  return language === 'ar' ? { ...order, name: order.nameAr ?? order.name, from: order.fromAr ?? order.from, to: order.toAr ?? order.to } : order;
}

export const MODES = ['All', 'Assigned', 'In progress', 'Completed', 'Cancelled'] as const;
export type Mode = (typeof MODES)[number];

export const ORDERS: Record<Mode, Order[]> = {
  All: [...ASSIGNED, { name: 'Liam Wilson', nameAr: 'ليام ويلسون', time: '00:10', from: 'Old Fourth Ward', fromAr: 'أولد فورث وارد', to: 'Decatur', toAr: 'ديكاتور', fromCoordinate: atlanta.oldFourthWard, toCoordinate: atlanta.decatur }],
  Assigned: ASSIGNED,
  'In progress': [{ name: 'Rachel Moore', nameAr: 'راشيل مور', time: '19:40', from: 'Midtown Atlanta', fromAr: 'وسط أتلانتا', to: 'East Point', toAr: 'إيست بوينت', fromCoordinate: atlanta.midtown, toCoordinate: atlanta.eastPoint }, { name: 'Ethan Harris', nameAr: 'إيثان هاريس', time: '20:05', from: 'Brookhaven', fromAr: 'بروكهافن', to: 'Downtown Atlanta', toAr: 'وسط أتلانتا', fromCoordinate: atlanta.brookhaven, toCoordinate: atlanta.downtown }],
  Completed: [{ name: 'Ava Clark', nameAr: 'آفا كلارك', time: '16:20', from: 'Buckhead', fromAr: 'باكهيد', to: 'Airport Terminal', toAr: 'صالة المطار', fromCoordinate: atlanta.buckhead, toCoordinate: atlanta.airport }, { name: 'William Lewis', nameAr: 'ويليام لويس', time: '17:00', from: 'Marietta Square', fromAr: 'ساحة ماريتا', to: 'Cumberland', toAr: 'كمبرلاند', fromCoordinate: atlanta.marietta, toCoordinate: atlanta.cumberland }],
  Cancelled: [{ name: 'Grace Young', nameAr: 'غريس يونغ', time: '15:30', from: 'Smyrna Market Village', fromAr: 'قرية سوق سميرنا', to: 'Vinings', toAr: 'فاينينغز', fromCoordinate: atlanta.smyrna, toCoordinate: atlanta.vinings }, { name: 'Henry Walker', nameAr: 'هنري ووكر', time: '16:45', from: 'Inman Park', fromAr: 'إنمان بارك', to: 'Little Five Points', toAr: 'ليتل فايف بوينتس', fromCoordinate: atlanta.inmanPark, toCoordinate: atlanta.littleFive }],
};
