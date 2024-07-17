import React from 'react';
import { Popover, Button, Tooltip } from '@arco-design/web-react';
import './adminHome.css'; // 引入CSS文件

function AdminHome() {
    const colors = ['#FCE996', '#C396ED', '#BEDAFF'];
    const buttonLabels = ['Appointment numbers', 'Classroom numbers', 'Student numbers'];

    return (
        <div>
            <h1>Welcome !</h1>
            <div className="button-container"> 
                {colors.map((color, index) => {
                    return (
                        <Tooltip key={color} color={color} content='tooltip text'>
                            <Button
                                className="button-style" // 应用按钮样式
                                style={{
                                    background: color, 
                                    height: '60px', // 确保高度样式被应用// 保留背景颜色的内联样式
                                    
                             }}
                            >
                                {buttonLabels[index]}
                            </Button>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
}

export default AdminHome;