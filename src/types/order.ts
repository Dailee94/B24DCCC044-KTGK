export enum OrderStatus {
	PENDING = 'Chờ xác nhận',
	SHIPPING = 'Đang giao',
	COMPLETED = 'Hoàn thành',
	CANCELLED = 'Hủy',
}

export interface Customer {
	id: string;
	name: string;
}

export interface Product {
	id: string;
	name: string;
	price: number;
}

export interface OrderItem {
	productId: string;
	quantity: number;
}

export interface Order {
	id: string;
	customerId: string;
	customerName: string;
	orderDate: string; // YYYY-MM-DD
	items: OrderItem[];
	total: number;
	status: OrderStatus;
}

export interface OrderFormValues {
	id: string;
	customerId: string;
	orderDate: string;
	items: OrderItem[];
	status: OrderStatus;
}
