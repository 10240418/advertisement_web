export interface ArrearageRecord {
  year: number;
  month: number;
  status: '已付' | '未付' | '-2003';
  amount?: number;
}

export interface BuildingData {
  building: string;
  floor: string;
  records: ArrearageRecord[];
} 