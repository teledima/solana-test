import { Table } from "antd"

const columns = [
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Sum (SOL)',
      dataIndex: 'sum',
      key: 'sum',
    },
];

type AccountsTableProps = {
    data: Array<Object>
}

const AccountsTable = ({ data } : AccountsTableProps) => {
    return <Table columns={columns} dataSource={data} pagination={false} style={{ padding: 20 }}/>
}

export default AccountsTable;