import { Form, Button, InputNumber } from "antd";

type DonateFormProps = {
    balance: number,
    sum: number,
    isOwner: boolean,
    onFinish: (values: any) => void
}


const DonateForm = ({ balance, sum,  isOwner, onFinish }: DonateFormProps) => {
    return (
        <Form 
            name='basic' 
            labelCol={{ span: 8 }} 
            wrapperCol={{ span:16 }}
            onFinish={onFinish}
        >
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <p style={{margin: 0}}> { isOwner ? "Total withdraw: " : "Total contributed" } {sum?.toString()} SOL </p>
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <p style={{margin: 0}}> Current balance: {balance?.toString()} SOL</p>
            </Form.Item>

            <Form.Item label="Amount" name="amount" rules={[{ required: true, message: 'Please input donate sum!' }]}>
            <InputNumber addonAfter="Lamport"/>
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type='primary' htmlType='submit'>{isOwner ? "Take donate" : "Make donate"}</Button>
            </Form.Item> 
        </Form>
    )
}

export default DonateForm;