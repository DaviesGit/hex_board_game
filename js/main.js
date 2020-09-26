layui.use(['jquery', 'form', 'layer'], function () {

    layui.$(function () {

        layui.form.render()
        //监听指定开关
        //监听模式开关
        layui.form.on('switch(mode)', function (data) {
            useComputer = this.checked;
        });
        //监听是否选择先手
        layui.form.on('switch(first)', function (data) {
            isFirst = this.checked;
        });
        //选择电脑等级
        layui.form.on('select(level)', function (data) {
            theComputerLevel = +data.value;
        });
        //棋盘上的每个格子（落子点）的点击事件处理
        layui.$('#piece>div>img').click(function (event) {
            layui.layer.closeAll();
            if (!isStart || isOver)
                return layui.layer.msg("请先开始游戏！", {
                    icon: 2
                });
            if (useComputer && currentMove === theComputer)
                return layui.layer.msg("现在还没有轮到你下哦！", {
                    icon: 2
                });
            let index = layui.$('#piece>div>img').index(event.target);
            let i = index % 11,
                j = Math.floor(index / 11);
            if (!makeMove(currentMove, i, j)) {
                return;
            }
            nextMove();
            if (showWinner(i, j))
                return;
            if (useComputer)
                setTimeout(notifyComputerMove, 500);
        });
        //悔棋按钮的点击处理事件
        layui.$('#undo').click(function (event) {
            if (isOver || MoveCount < 2)
                return layui.layer.msg("现在不能悔棋哦！", {
                    icon: 2
                });
            MoveCount -= 2;
            //虽然是数组，但是形式上使用了栈，退栈，在悔棋时，将原来已经赋值了的Fld中的数字归零
            //退栈
            Fld[History[MoveCount][1]][History[MoveCount][0]] = 0;
            Fld[History[MoveCount + 1][1]][History[MoveCount + 1][0]] = 0;
            updatePot(theComputerLevel);
            setTimeout(function () {
                showPot();
            }, 0);
            updateBoardFromHistory();
            total_steps.innerHTML = MoveCount;
            showHistory();
        });
        //开始按钮的点击处理事件
        layui.$('#start').click(function (event) {
            start();
        });
        //重玩按钮的点击处理事件
        layui.$('#replay').click(function (event) {
            start();
        });
        //
        layui.$('#about_button').click(function (event) {
            layui.layer.open({
                type: 1,
                title: 'Hex棋说明',
                content: layui.$("#about_info"),
                maxmin: true,
                skin: 'layui-layer-rim', //加上边框
                area: ['1200px;', '95%'], //宽高
                shade: 0.5,
                btn: ['好的', '取消'],
                btn1: function (index, layero) {
                    layui.layer.msg("感谢你的阅读！", {
                        icon: 1
                    });
                    layui.layer.close(index);
                },
                btn2: function (index, layero) {
                    layui.layer.close(index);
                },
                cancel: function (index, layero) {
                    layui.layer.close(index);
                }
            });
        });
    });
});
