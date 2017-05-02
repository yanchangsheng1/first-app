const express = require('express');
const app = express();

//配置路由
app.get('/',(req,res)=>{
	res.send('hello world');
})

//监听端口
app.listen(3000,()=>{
	console.log('running at port 3000...')
})
