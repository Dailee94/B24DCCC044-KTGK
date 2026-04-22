import { Order, OrderStatus } from '@/types/order';
import { ORDER_STORAGE_KEY } from '@/utils/order';

const defaultOrders: Order[] = [
	{
		id: 'DH001',
		customerId: 'C001',
		customerName: 'Nguyễn Văn A',
		orderDate: '2026-04-20',
		items: [
			{ productId: 'P001', quantity: 2 },
			{ productId: 'P004', quantity: 1 },
		],
		total: 330000,
		status: OrderStatus.PENDING,
	},
	{
		id: 'DH002',
		customerId: 'C002',
		customerName: 'Trần Thị B',
		orderDate: '2026-04-18',
		items: [
			{ productId: 'P003', quantity: 1 },
			{ productId: 'P005', quantity: 2 },
		],
		total: 910000,
		status: OrderStatus.SHIPPING,
	},
	{
		id: 'DH003',
		customerId: 'C003',
		customerName: 'Lê Văn C',
		orderDate: '2026-04-15',
		items: [
			{ productId: 'P002', quantity: 1 },
			{ productId: 'P006', quantity: 1 },
		],
		total: 940000,
		status: OrderStatus.COMPLETED,
	},
];

export const getOrderList = async (): Promise<Order[]> => {
	const raw = localStorage.getItem(ORDER_STORAGE_KEY);

	if (!raw) {
		localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(defaultOrders));
		return defaultOrders;
	}

	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : defaultOrders;
	} catch (error) {
		localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(defaultOrders));
		return defaultOrders;
	}
};

export const saveOrderList = async (orders: Order[]): Promise<void> => {
	localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
};
