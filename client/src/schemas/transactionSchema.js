import { z } from 'zod';

export const transactionSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Nama transaksi minimal 3 karakter' })
    .max(50, { message: 'Nama transaksi maksimal 50 karakter' }),
  price: z
    .number({ invalid_type_error: 'Nominal harus berupa angka' })
    .positive({ message: 'Nominal harus lebih dari 0' }),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, { message: 'Kategori harus dipilih' }),
});