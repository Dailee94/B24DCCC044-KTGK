import { Customer, OrderItem, Product } from '@/types/order';

export const ORDER_STORAGE_KEY = 'ORDER_MANAGEMENT_DATA';

export const CUSTOMER_OPTIONS: Customer[] = [
	{ id: 'C001', name: 'Nguyễn Văn A' },
	{ id: 'C002', name: 'Trần Thị B' },
	{ id: 'C003', name: 'Lê Văn C' },
	{ id: 'C004', name: 'Phạm Thị D' },
	{ id: 'C005', name: 'Hoàng Văn E' },
];

export const PRODUCT_OPTIONS: Product[] = [
	{ id: 'P001', name: 'Áo thun', price: 120000 },
	{ id: 'P002', name: 'Quần jean', price: 350000 },
	{ id: 'P003', name: 'Giày thể thao', price: 850000 },
	{ id: 'P004', name: 'Mũ lưỡi trai', price: 90000 },
	{ id: 'P005', name: 'Tất', price: 30000 },
	{ id: 'P006', name: 'Áo khoác', price: 590000 },
];

export const getCustomerById = (customerId: string) => CUSTOMER_OPTIONS.find((item) => item.id === customerId);

export const getProductById = (productId: string) => PRODUCT_OPTIONS.find((item) => item.id === productId);

export const calculateOrderTotal = (items: OrderItem[]): number => {
	return items.reduce((sum, item) => {
		const product = getProductById(item.productId);
		if (!product) return sum;
		return sum + product.price * item.quantity;
	}, 0);
};

export const formatCurrency = (value: number): string =>
	new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND',
	}).format(value);

export const normalizeText = (value: string) => value.trim().toLowerCase();

export const isDuplicateProduct = (items: OrderItem[]) => {
	const ids = items.map((item) => item.productId).filter(Boolean);
	return new Set(ids).size !== ids.length;
};
