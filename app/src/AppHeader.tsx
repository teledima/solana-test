import { Layout, Button } from "antd";
import { MouseEventHandler } from "react";

const { Header } = Layout;

type AppHeaderProps = {
    onConnect: MouseEventHandler
}

const AppHeader = ({onConnect}: AppHeaderProps) => {
    return (
        <Header>
          <Button type='primary' onClick={onConnect}>Connect wallet</Button>
        </Header>
    )
}

export default AppHeader;