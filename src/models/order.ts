import { useCallback, useState } from 'react';
import { message } from 'antd';
import { getOrderList, saveOrderList } from '@/services/order';
import { Order, OrderFormValues, OrderStatus } from '@/types/order';
import { calculateOrderTotal, getCustomerById, isDuplicateProduct, normalizeText } from '@/utils/order';

export default function useOrderModel() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	const loadOrders = useCallback(async () => {
		try {
			setLoading(true);
			const data = await getOrderList();
			setOrders(data);
		} finally {
			setLoading(false);
		}
	}, []);

	const persistOrders = useCallback(async (nextOrders: Order[]) => {
		setOrders(nextOrders);
		await saveOrderList(nextOrders);
	}, []);

	const validateOrder = useCallback(
		(values: OrderFormValues, editingId?: string) => {
			if (!values.id?.trim()) {
				throw new Error('Mã đơn hàng không được để trống');
			}

			if (!values.customerId) {
				throw new Error('Vui lòng chọn khách hàng');
			}

			if (!values.orderDate) {
				throw new Error('Vui lòng chọn ngày đặt hàng');
			}

			if (!values.items || values.items.length === 0) {
				throw new Error('Vui lòng chọn ít nhất 1 sản phẩm');
			}

			const hasInvalidItem = values.items.some((item) => !item.productId || !item.quantity || item.quantity <= 0);

			if (hasInvalidItem) {
				throw new Error('Danh sách sản phẩm không hợp lệ');
			}

			if (isDuplicateProduct(values.items)) {
				throw new Error('Không được chọn trùng sản phẩm trong cùng đơn hàng');
			}

			const duplicatedCode = orders.some(
				(item) => normalizeText(item.id) === normalizeText(values.id) && item.id !== editingId,
			);

			if (duplicatedCode) {
				throw new Error('Mã đơn hàng đã tồn tại');
			}
		},
		[orders],
	);

	const buildOrder = useCallback((values: OrderFormValues): Order => {
		const customer = getCustomerById(values.customerId);

		return {
			id: values.id.trim(),
			customerId: values.customerId,
			customerName: customer?.name || '',
			orderDate: values.orderDate,
			items: values.items,
			total: calculateOrderTotal(values.items),
			status: values.status,
		};
	}, []);

	const addOrder = useCallback(
		async (values: OrderFormValues) => {
			validateOrder(values);

			const newOrder = buildOrder(values);
			const nextOrders = [newOrder, ...orders];

			await persistOrders(nextOrders);
			message.success('Thêm đơn hàng thành công');
		},
		[buildOrder, orders, persistOrders, validateOrder],
	);

	const updateOrder = useCallback(
		async (editingId: string, values: OrderFormValues) => {
			validateOrder(values, editingId);

			const updatedOrder = buildOrder(values);
			const nextOrders = orders.map((item) => (item.id === editingId ? updatedOrder : item));

			await persistOrders(nextOrders);
			message.success('Cập nhật đơn hàng thành công');
		},
		[buildOrder, orders, persistOrders, validateOrder],
	);

	const cancelOrder = useCallback(
		async (orderId: string) => {
			const target = orders.find((item) => item.id === orderId);

			if (!target) {
				throw new Error('Không tìm thấy đơn hàng');
			}

			if (target.status !== OrderStatus.PENDING) {
				throw new Error('Chỉ được hủy đơn hàng ở trạng thái "Chờ xác nhận"');
			}

			const nextOrders = orders.map((item) =>
				item.id === orderId ? { ...item, status: OrderStatus.CANCELLED } : item,
			);

			await persistOrders(nextOrders);
			message.success('Hủy đơn hàng thành công');
		},
		[orders, persistOrders],
	);

	return {
		orders,
		loading,
		loadOrders,
		addOrder,
		updateOrder,
		cancelOrder,
	};
}
