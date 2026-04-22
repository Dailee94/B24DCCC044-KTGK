import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, message, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import OrderFormModal from './components/OrderFormModal';
import { getOrderList, saveOrderList } from '@/services/order';
import { Order, OrderFormValues, OrderStatus, OrderItem } from '@/types/order';
import {
	calculateOrderTotal,
	formatCurrency,
	getCustomerById,
	isDuplicateProduct,
	normalizeText,
	PRODUCT_OPTIONS,
} from '@/utils/order';

const { Title } = Typography;
const { confirm } = Modal;

const statusColorMap: Record<OrderStatus, string> = {
	[OrderStatus.PENDING]: 'gold',
	[OrderStatus.SHIPPING]: 'blue',
	[OrderStatus.COMPLETED]: 'green',
	[OrderStatus.CANCELLED]: 'red',
};

const OrderPage: React.FC = () => {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [keyword, setKeyword] = useState('');
	const [statusFilter, setStatusFilter] = useState<string | undefined>();
	const [visibleFormModal, setVisibleFormModal] = useState(false);
	const [editingOrder, setEditingOrder] = useState<Order | null>(null);

	const loadOrders = async () => {
		try {
			setLoading(true);
			const data = await getOrderList();
			setOrders(data);
		} catch (error) {
			message.error('Không tải được danh sách đơn hàng');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadOrders();
	}, []);

	const persistOrders = async (nextOrders: Order[]) => {
		setOrders(nextOrders);
		await saveOrderList(nextOrders);
	};

	const validateOrder = (values: OrderFormValues, editingId?: string) => {
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

		const hasInvalidItem = values.items.some(
			(item: OrderItem) => !item.productId || !item.quantity || item.quantity <= 0,
		);

		if (hasInvalidItem) {
			throw new Error('Danh sách sản phẩm không hợp lệ');
		}

		if (isDuplicateProduct(values.items)) {
			throw new Error('Không được chọn trùng sản phẩm trong cùng đơn hàng');
		}

		const duplicatedCode = orders.some(
			(item: Order) => normalizeText(item.id) === normalizeText(values.id) && item.id !== editingId,
		);

		if (duplicatedCode) {
			throw new Error('Mã đơn hàng đã tồn tại');
		}
	};

	const buildOrder = (values: OrderFormValues): Order => {
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
	};

	const addOrder = async (values: OrderFormValues) => {
		validateOrder(values);

		const newOrder = buildOrder(values);
		const nextOrders = [newOrder, ...orders];

		await persistOrders(nextOrders);
		message.success('Thêm đơn hàng thành công');
	};

	const updateOrder = async (editingId: string, values: OrderFormValues) => {
		validateOrder(values, editingId);

		const updatedOrder = buildOrder(values);
		const nextOrders = orders.map((item: Order) => (item.id === editingId ? updatedOrder : item));

		await persistOrders(nextOrders);
		message.success('Cập nhật đơn hàng thành công');
	};

	const cancelOrder = async (orderId: string) => {
		const target = orders.find((item: Order) => item.id === orderId);

		if (!target) {
			throw new Error('Không tìm thấy đơn hàng');
		}

		if (target.status !== OrderStatus.PENDING) {
			throw new Error('Chỉ được hủy đơn hàng ở trạng thái "Chờ xác nhận"');
		}

		const nextOrders = orders.map((item: Order) =>
			item.id === orderId ? { ...item, status: OrderStatus.CANCELLED } : item,
		);

		await persistOrders(nextOrders);
		message.success('Hủy đơn hàng thành công');
	};

	const filteredOrders = useMemo(() => {
		const normalizedKeyword = keyword.trim().toLowerCase();

		return orders.filter((item: Order) => {
			const matchKeyword =
				!normalizedKeyword ||
				item.id.toLowerCase().includes(normalizedKeyword) ||
				item.customerName.toLowerCase().includes(normalizedKeyword);

			const matchStatus = !statusFilter || item.status === statusFilter;

			return matchKeyword && matchStatus;
		});
	}, [keyword, orders, statusFilter]);

	const handleOpenCreate = () => {
		setEditingOrder(null);
		setVisibleFormModal(true);
	};

	const handleOpenEdit = (record: Order) => {
		setEditingOrder(record);
		setVisibleFormModal(true);
	};

	const handleCancelOrder = (record: Order) => {
		if (record.status !== OrderStatus.PENDING) {
			message.error('Chỉ được hủy đơn hàng ở trạng thái "Chờ xác nhận"');
			return;
		}

		confirm({
			title: 'Xác nhận hủy đơn hàng',
			icon: <ExclamationCircleOutlined />,
			content: `Bạn có chắc chắn muốn hủy đơn hàng ${record.id}?`,
			okText: 'Đồng ý',
			cancelText: 'Không',
			onOk: async () => {
				try {
					await cancelOrder(record.id);
				} catch (error: any) {
					message.error(error?.message || 'Hủy đơn hàng thất bại');
				}
			},
		});
	};

	const handleSubmit = async (values: OrderFormValues) => {
		try {
			if (editingOrder) {
				await updateOrder(editingOrder.id, values);
			} else {
				await addOrder(values);
			}

			setVisibleFormModal(false);
			setEditingOrder(null);
		} catch (error: any) {
			message.error(error?.message || 'Thao tác thất bại');
		}
	};

	const columns: ColumnsType<Order> = [
		{
			title: 'Mã đơn hàng',
			dataIndex: 'id',
			key: 'id',
			width: 140,
		},
		{
			title: 'Khách hàng',
			dataIndex: 'customerName',
			key: 'customerName',
			width: 220,
		},
		{
			title: 'Ngày đặt hàng',
			dataIndex: 'orderDate',
			key: 'orderDate',
			width: 160,
			sorter: (a: Order, b: Order) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(),
		},
		{
			title: 'Sản phẩm',
			key: 'items',
			render: (_: unknown, record: Order) =>
				record.items
					.map((item: OrderItem) => {
						const product = PRODUCT_OPTIONS.find((productItem) => productItem.id === item.productId);
						return `${product?.name || item.productId} x ${item.quantity}`;
					})
					.join(', '),
		},
		{
			title: 'Tổng tiền',
			dataIndex: 'total',
			key: 'total',
			width: 160,
			sorter: (a: Order, b: Order) => a.total - b.total,
			render: (value: number) => formatCurrency(value),
		},
		{
			title: 'Trạng thái',
			dataIndex: 'status',
			key: 'status',
			width: 160,
			render: (value: OrderStatus) => <Tag color={statusColorMap[value]}>{value}</Tag>,
		},
		{
			title: 'Thao tác',
			key: 'action',
			width: 220,
			render: (_: unknown, record: Order) => (
				<Space>
					<Button type='link' onClick={() => handleOpenEdit(record)}>
						Chỉnh sửa
					</Button>

					<Button
						type='link'
						danger
						disabled={record.status !== OrderStatus.PENDING}
						onClick={() => handleCancelOrder(record)}
					>
						Hủy đơn hàng
					</Button>
				</Space>
			),
		},
	];

	return (
		<Card>
			<Space direction='vertical' size={16} style={{ width: '100%' }}>
				<Title level={3} style={{ margin: 0 }}>
					Quản lý đơn hàng
				</Title>

				<Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
					<Space wrap>
						<Input
							allowClear
							style={{ width: 320 }}
							placeholder='Tìm theo mã đơn hàng hoặc khách hàng'
							value={keyword}
							onChange={(e) => setKeyword(e.target.value)}
						/>

						<Select
							allowClear
							style={{ width: 220 }}
							placeholder='Lọc theo trạng thái'
							value={statusFilter}
							onChange={setStatusFilter}
							options={Object.values(OrderStatus).map((status) => ({
								label: status,
								value: status,
							}))}
						/>
					</Space>

					<Button type='primary' icon={<PlusOutlined />} onClick={handleOpenCreate}>
						Thêm đơn hàng
					</Button>
				</Space>

				<Table<Order> rowKey='id' bordered loading={loading} dataSource={filteredOrders} columns={columns} />
			</Space>

			<OrderFormModal
				visible={visibleFormModal}
				initialValues={editingOrder}
				onCancel={() => {
					setVisibleFormModal(false);
					setEditingOrder(null);
				}}
				onSubmit={handleSubmit}
			/>
		</Card>
	);
};

export default OrderPage;
