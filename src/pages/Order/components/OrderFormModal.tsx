import React, { useEffect, useMemo } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Order, OrderFormValues, OrderStatus } from '@/types/order';
import { calculateOrderTotal, CUSTOMER_OPTIONS, formatCurrency, PRODUCT_OPTIONS } from '@/utils/order';

const { Text } = Typography;

interface OrderFormModalProps {
	visible: boolean;
	initialValues?: Order | null;
	onCancel: () => void;
	onSubmit: (values: OrderFormValues) => Promise<void>;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({ visible, initialValues, onCancel, onSubmit }) => {
	const [form] = Form.useForm();

	const watchedItems = Form.useWatch('items', form) || [];

	const totalAmount = useMemo(() => {
		return calculateOrderTotal(watchedItems);
	}, [watchedItems]);

	useEffect(() => {
		if (!visible) return;

		if (initialValues) {
			form.setFieldsValue({
				id: initialValues.id,
				customerId: initialValues.customerId,
				orderDate: dayjs(initialValues.orderDate),
				items: initialValues.items,
				status: initialValues.status,
			});
			return;
		}

		form.setFieldsValue({
			id: '',
			customerId: undefined,
			orderDate: dayjs(),
			items: [{ productId: undefined, quantity: 1 }],
			status: OrderStatus.PENDING,
		});
	}, [form, initialValues, visible]);

	const handleOk = async () => {
		const values = await form.validateFields();

		const payload: OrderFormValues = {
			id: values.id,
			customerId: values.customerId,
			orderDate: values.orderDate.format('YYYY-MM-DD'),
			items: values.items,
			status: values.status,
		};

		await onSubmit(payload);
		form.resetFields();
	};

	return (
		<Modal
			visible={visible}
			title={initialValues ? 'Chỉnh sửa đơn hàng' : 'Thêm đơn hàng'}
			onCancel={onCancel}
			onOk={handleOk}
			okText={initialValues ? 'Cập nhật' : 'Thêm mới'}
			cancelText='Đóng'
			width={900}
			destroyOnClose
		>
			<Form form={form} layout='vertical'>
				<Form.Item label='Mã đơn hàng' name='id' rules={[{ required: true, message: 'Vui lòng nhập mã đơn hàng' }]}>
					<Input placeholder='Nhập mã đơn hàng' />
				</Form.Item>

				<Form.Item
					label='Khách hàng'
					name='customerId'
					rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
				>
					<Select
						placeholder='Chọn khách hàng'
						options={CUSTOMER_OPTIONS.map((item) => ({
							label: `${item.id} - ${item.name}`,
							value: item.id,
						}))}
					/>
				</Form.Item>

				<Form.Item
					label='Ngày đặt hàng'
					name='orderDate'
					rules={[{ required: true, message: 'Vui lòng chọn ngày đặt hàng' }]}
				>
					<DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' />
				</Form.Item>

				<Form.Item
					label='Trạng thái đơn hàng'
					name='status'
					rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
				>
					<Select
						options={Object.values(OrderStatus).map((status) => ({
							label: status,
							value: status,
						}))}
					/>
				</Form.Item>

				<Form.List name='items'>
					{(fields, { add, remove }) => (
						<>
							<Text strong>Danh sách sản phẩm</Text>

							{fields.map((field) => (
								<Space key={field.key} align='start' style={{ display: 'flex', marginTop: 12 }}>
									<Form.Item
										{...field}
										label='Sản phẩm'
										name={[field.name, 'productId']}
										rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
										style={{ minWidth: 360 }}
									>
										<Select
											placeholder='Chọn sản phẩm'
											options={PRODUCT_OPTIONS.map((item) => ({
												label: `${item.name} - ${formatCurrency(item.price)}`,
												value: item.id,
											}))}
										/>
									</Form.Item>

									<Form.Item
										{...field}
										label='Số lượng'
										name={[field.name, 'quantity']}
										rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
									>
										<InputNumber min={1} style={{ width: 140 }} />
									</Form.Item>

									<Button
										danger
										icon={<MinusCircleOutlined />}
										style={{ marginTop: 30 }}
										disabled={fields.length === 1}
										onClick={() => remove(field.name)}
									>
										Xóa
									</Button>
								</Space>
							))}

							<Button type='dashed' icon={<PlusOutlined />} onClick={() => add({ productId: undefined, quantity: 1 })}>
								Thêm sản phẩm
							</Button>
						</>
					)}
				</Form.List>

				<div style={{ marginTop: 20 }}>
					<Table
						bordered
						size='small'
						pagination={false}
						rowKey={(record, index) => `${record.productId}-${index}`}
						dataSource={watchedItems}
						columns={[
							{
								title: 'Sản phẩm',
								dataIndex: 'productId',
								render: (value: string) => PRODUCT_OPTIONS.find((item) => item.id === value)?.name || '',
							},
							{
								title: 'Số lượng',
								dataIndex: 'quantity',
							},
							{
								title: 'Đơn giá',
								render: (_, record: any) => {
									const product = PRODUCT_OPTIONS.find((item) => item.id === record.productId);
									return product ? formatCurrency(product.price) : '';
								},
							},
							{
								title: 'Thành tiền',
								render: (_, record: any) => {
									const product = PRODUCT_OPTIONS.find((item) => item.id === record.productId);
									return formatCurrency((product?.price || 0) * (record.quantity || 0));
								},
							},
						]}
					/>
				</div>

				<div
					style={{
						textAlign: 'right',
						marginTop: 16,
						fontWeight: 600,
						fontSize: 16,
					}}
				>
					Tổng tiền: {formatCurrency(totalAmount)}
				</div>
			</Form>
		</Modal>
	);
};

export default OrderFormModal;
