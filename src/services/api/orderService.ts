import { DonHang } from '@/types';
import { donHangData } from '@/data/orders';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const orderService = {
  async getByCustomerId(customerId: number): Promise<DonHang[]> {
    await delay(300);
    return donHangData.filter(o => o.khachHangId === customerId);
  },

  async getById(id: number): Promise<DonHang | undefined> {
    await delay(200);
    return donHangData.find(o => o.id === id);
  },

  async getAll(): Promise<DonHang[]> {
    await delay(300);
    return donHangData;
  },
};
