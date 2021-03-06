module game {

    export class GameMediator extends puremvc.Mediator implements puremvc.IMediator {
        public static NAME: string = "GameScreenMediator";
        public num = 0;
        public timer_3: egret.Timer;
        public constructor(viewComponent: any) {
            super(GameMediator.NAME, viewComponent);
            this.gameScreen.backBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.backButtonClick, this);
            this.gameScreen.checkBox_giveUp.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onChange, this);
            this.gameScreen.checkBox_autoPass.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onChange, this);
            this.gameScreen.checkBox_followAny.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onChange, this);

            this.gameScreen.giveUpBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.giveupAction, this);
            this.gameScreen.passBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.passAction, this);
            this.gameScreen.addChipBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.addChipAction, this);

            this.gameScreen.MoneyBtnSmallest.addEventListener(egret.TouchEvent.TOUCH_TAP, this.countBetNum, this);
            this.gameScreen.MoneyBtnSmall.addEventListener(egret.TouchEvent.TOUCH_TAP, this.countBetNum, this);
            this.gameScreen.MoneyBtnNormal.addEventListener(egret.TouchEvent.TOUCH_TAP, this.countBetNum, this);
            this.gameScreen.MoneyBtnBig.addEventListener(egret.TouchEvent.TOUCH_TAP, this.countBetNum, this);
            this.gameScreen.MoneyBtnBiggest.addEventListener(egret.TouchEvent.TOUCH_TAP, this.countBetNum, this);
            this.gameScreen.RangeMoneyBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.countBetNum, this);


            this.gameScreen.multipleBtn1.addEventListener(egret.TouchEvent.TOUCH_TAP, this.countBetMul, this);
            this.gameScreen.multipleBtn2.addEventListener(egret.TouchEvent.TOUCH_TAP, this.countBetMul, this);
            this.gameScreen.multipleBtn3.addEventListener(egret.TouchEvent.TOUCH_TAP, this.countBetMul, this);
            this.gameScreen.users[3].addEventListener(User.GIVEUP, function () {
                console.log("users[3]计时结束");

            }, this);

            this.timer_3 = new egret.Timer(1000, 20);
            this.timer_3.addEventListener(egret.TimerEvent.TIMER_COMPLETE, function () {
                this.sendNotification(ApplicationMediator.ENTER_LOBBY);
                NetController.getInstance().close(NetController.GAMESOCKET);
            }, this);

        }
        ///处理复选框的change事件回调
        private onChange(event: egret.TouchEvent) {
            SoundManager.getIns().playSound("all_buttons_mp3");
            ///获得当前复选框
            let checkBox: eui.CheckBox = <eui.CheckBox>event.target;
            let preAction: number;
            switch (checkBox.name) { //强行单选化
                case "giveUpOrPass": {
                    this.gameScreen.checkBox_autoPass.selected = false;
                    this.gameScreen.checkBox_followAny.selected = false;
                    preAction = Actions.giveUpOrPass;
                    break;
                }
                case "autoPass": {
                    this.gameScreen.checkBox_giveUp.selected = false;
                    this.gameScreen.checkBox_followAny.selected = false;
                    preAction = Actions.autoPass;
                    break;
                }
                case "followAny": {
                    this.gameScreen.checkBox_giveUp.selected = false;
                    this.gameScreen.checkBox_autoPass.selected = false;
                    preAction = Actions.followAny;
                    break;
                }
            }
            //记录下此时的CheckBox状态，待到轮到自己的时候再取出信息，根据信息判断下一步操作发送什么信息
            //  this.sendNotification(GameCommand.ACTION,event.currentTarget.name);


            CachePool.addObj("preCheckBox", checkBox);
            if (checkBox.currentState == "disabled" || checkBox.currentState == "disabledAndSelected") {
                // label.text = "禁用状态，无法选择";
            } else {
                ///获得当前复选框的标签并显示出来
                console.log(checkBox.selected);
                if (checkBox.selected) {
                    CachePool.addObj("preAction", preAction);
                } else {
                    CachePool.clear("preAction");
                }
                ///取消显示设置复选框的状态，由内部的 getCurrentState() 决定。
                // checkBox.currentState = null;
            }

        }

        public backButtonClick(event: egret.TouchEvent) {
            SoundManager.getIns().playSound("all_buttons_mp3");
            console.warn("点击返回");
            this.sendNotification(ApplicationMediator.ENTER_LOBBY);
            AnimationUtils.getInstance().removeAllAnimation();
            this.gameScreen.stopMyRotate();
            this.timer_3.stop();

            // var data = new BaseMsg();
            // data.command = Commands.EXIT_TABLE;
            // data.content = { "uId": UserUtils.getInstance().getOwnUser().uId, "tId": UserUtils.getInstance().getOwnUser().tId };
            // NetController.getInstance().sendData(NetController.MATCHSOCKET, data);

            NetController.getInstance().close(NetController.GAMESOCKET);
        }

        public listNotificationInterests(): Array<any> {
            return [
                GameProxy.CHANGE_STATE,
                GameProxy.ADD_USER,
                GameProxy.REM_USER,
                GameProxy.ADD_CHIP,
                GameProxy.POP_CARD,
                GameProxy.FOLD,
                GameProxy.CHECK,
                GameProxy.CALL,
                GameProxy.AllIN,
                GameProxy.POP_PUBLICCARD,
                GameProxy.RESULT,
                GameProxy.GAME_RESET
            ];
        }

        public handleNotification(notification: puremvc.INotification): void {
            var data: any = notification.getBody();
            this.playMp3(notification.getName());
            switch (notification.getName()) {
                case GameProxy.CHANGE_STATE: {
                    this.gameScreen.switchBottomState(<String><any>data);
                    break;
                }
                case GameProxy.ADD_USER: {
                    this.gameScreen.addOneUserAction(<User><any>data);
                    break;
                }
                case GameProxy.REM_USER: {
                    this.gameScreen.removeOneUserAction(<number><any>data);
                    break;
                }
                case GameProxy.FOLD:
                    this.gameScreen.playerFold(data.uid, data.raiseStack);
                case GameProxy.ADD_CHIP:
                case GameProxy.CALL:
                case GameProxy.AllIN:
                    this.userAddChip(data.uid, data.raiseStack);
                case GameProxy.CHECK:
                    {
                        this.gameScreen.changePlayer(data.uid, data.nextplayer);
                        if (data.uid == UserUtils.getInstance().getOwnUser().uId) {
                            CachePool.addObj("ownBet", data.stake);
                        }
                        if (data.nextplayer == UserUtils.getInstance().getOwnUser().uId) {
                            SoundManager.getIns().playSound("remind_me_mp3");
                            let ownBet = CachePool.getObj("ownBet");
                            if (!ownBet)
                                ownBet = 0;
                            CachePool.addObj("canBet", data.stake - ownBet);
                            if (!this.changeBtnState(data.operator, data.stake)) {
                                this.gameScreen.switchBottomState("first_Bet");
                            }
                        } else if (data.nextplayer != "") {
                            this.gameScreen.switchBottomState("three_choose");
                        }
                    }
                    break;
                case GameProxy.POP_CARD: {
                    this.userGetCards(data.holeCards);
                    break;
                }
                case GameProxy.POP_PUBLICCARD: {
                    this.gameScreen.sendMoneyAnimation();
                    this.gameScreen.sendPublicCard(data.times);
                    this.gameScreen.changePlayer("", data.nextplayer);

                    CachePool.clear("ownBet");
                    if (data.nextplayer == UserUtils.getInstance().getOwnUser().uId) {
                        if (!this.changeBtnState(data.operator, 0)) {
                            this.gameScreen.switchBottomState("first_Bet");
                        }
                    } else {
                        this.gameScreen.switchBottomState("three_choose");
                    }
                    break;
                }
                case GameProxy.RESULT: {
                    this.gameScreen.changeToNoBottom();
                    this.gameScreen.stopMyRotate();
                    this.gameScreen.sendMoneyAnimation();
                    
                    var userArray: Array<any> = data.user;
                    //给钱动画和显示手牌
                    for (var i = 0; i < userArray.length; i++) {
                        var user: User = UserUtils.getInstance().getUserFromUid(userArray[i].uid);
                        if (user) {
                            //给钱
                            this.gameScreen.giveChipAction(userArray[i].winStake, user.seat);
                            //显示手牌
                            this.gameScreen.showUserCards(userArray[i].holeCards, user.seat);
                            //改牌型文本
                            this.gameScreen.changeUserNameLabelToCardShape(CardResult[userArray[i].pokerType - 1], user.seat);
                        } else {
                            AnimationUtils.getInstance().changeLabelNumber(this.gameScreen["baseChipNum"], -userArray[i].winStake);
                        }
                    }
                    //显示高亮牌
                    this.gameScreen.showHeightLightPublicCard(data.bestGroup, data.user);

                    this.timer_3.reset();
                    this.timer_3.start();
                    break;
                }
                case GameProxy.GAME_RESET: {
                    this.timer_3.stop();
                    UserUtils.getInstance().getOwnUser().clearcards();
                    UserUtils.getInstance().clearAllUser();
                    this.gameScreen.hideOwnCards();
                    this.gameScreen.hideAllUserAndChip();
                    this.gameScreen.hideOtherCardsAndResetName();
                    this.gameScreen.hidePublicCard();
                    CachePool.clearAll();
                    break;
                }
            }
        }
        public get gameScreen(): GameScreen {
            return <GameScreen><any>(this.viewComponent);
        }

        public playMp3(action: string) {
            switch (action) {
                case GameProxy.FOLD:
                    SoundManager.getIns().playSound("male_discard_mp3");
                    break;
                case GameProxy.ADD_CHIP:
                    SoundManager.getIns().playSound("male_plus_mp3");
                    break;
                case GameProxy.AllIN:
                    SoundManager.getIns().playSound("male_allin_mp3");
                    break;
                case GameProxy.CALL:
                    SoundManager.getIns().playSound("male_with_mp3");
                    break;
                case GameProxy.CHECK:
                    SoundManager.getIns().playSound("too_mp3");
                    break;
            }
        }

        public giveupAction(event?: egret.TouchEvent) {
            SoundManager.getIns().playSound("all_buttons_mp3");
            // this.gameScreen.giveChipAction(parseInt(this.gameScreen["baseChipNum"].text), 4);
            this.sendNotification(GameCommand.ACTION, { "action": Actions.giveup, "raiseStack": 0 });
            this.gameScreen.changeToNoBottom();
        }

        public passAction(event?: egret.TouchEvent) {
            SoundManager.getIns().playSound("all_buttons_mp3");
            console.log(CachePool.getObj("canBet"));

            this.sendNotification(GameCommand.ACTION, { "action": CachePool.getObj("action"), "raiseStack": CachePool.getObj("canBet") });
            this.gameScreen.changeToNoBottom();
        }

        public addChipAction(event: egret.TouchEvent) {
            SoundManager.getIns().playSound("all_buttons_mp3");
            this.sendNotification(GameProxy.CHANGE_STATE, "count_choose");
        }

        public countBetNum(event: egret.TouchEvent) {
            SoundManager.getIns().playSound("all_buttons_mp3");
            // var data: BaseMsg = new BaseMsg();
            // data.command = Commands.PLAYERBET;
            // data.content = { "action": 1, "uId": UserUtils.getInstance().getOwnUser().uId, "tId": "1", "raiseStack": parseInt(event.currentTarget.label) };
            // NetController.getInstance().sendData(NetController.GAMESOCKET, data);

            // this.gameScreen.addChipAnimation(parseInt(event.currentTarget.label), 4);
            this.sendNotification(GameCommand.ACTION, { "action": Actions.bet, "raiseStack": parseInt(event.currentTarget.label) });
            // this.sendNotification(GameProxy.CHANGE_STATE, "count_choose");
            this.gameScreen.changeToNoBottom();
        }

        public countBetMul(event: egret.TouchEvent) {
            console.log(<eui.Button>event.currentTarget.label);
        }

        public userAddChip(uId: string, chip: number) {
            var seat: number = UserUtils.getInstance().getUserFromUid(uId).seat;
            this.gameScreen.addChipAnimation(chip, seat);
        }
        public userGetCards(cards: Array<number>) {
            UserUtils.getInstance().getOwnUser().initcards(cards);
            this.gameScreen.beginAnimation();
        }

        public changeBtnState(operator: number, stake: number): boolean {
            let preAction = CachePool.getObj("preAction");
            let preActionIsExecute: boolean = false;
            switch (operator) {
                case StateCode.FOLLOWBET:
                    this.gameScreen.passBtn.label = "跟    注";
                    CachePool.addObj("action", Actions.call);
                    if (preAction && (preAction == Actions.followAny)) {
                        this.passAction();
                        preActionIsExecute = true;
                    } else if (preAction == Actions.giveUpOrPass) {
                        this.giveupAction();
                        preActionIsExecute = true;
                    }
                    break;
                case StateCode.PASSBET:
                    this.gameScreen.passBtn.label = "让    牌";
                    CachePool.addObj("action", Actions.pass);
                    if (preAction && (preAction == Actions.autoPass || preAction == Actions.giveUpOrPass || preAction == Actions.followAny)) {
                        this.passAction();
                        preActionIsExecute = true;
                    }
                    break;
                case StateCode.JUSTALLIN:
                    this.gameScreen.passBtn.label = "全    下";
                    CachePool.addObj("action", Actions.allin);
                    this.gameScreen.addChipBtn.alpha = 0.5;
                    this.gameScreen.addChipBtn.touchEnabled = false;
                    if (preAction && (preAction == Actions.giveUpOrPass)) {
                        this.giveupAction();
                        preActionIsExecute = true;
                    } else if (preAction && (preAction == Actions.followAny)) {
                        this.passAction();
                        preActionIsExecute = true;
                    }
                    break;
            }
            let checkBox = (<eui.CheckBox>CachePool.getObj("preCheckBox"));
            if (checkBox) {
                checkBox.selected = false;
            }
            CachePool.clear("preAction");
            if (operator != StateCode.JUSTALLIN) {
                this.gameScreen.addChipBtn.alpha = 1;
                this.gameScreen.addChipBtn.touchEnabled = true;
            } else {
                return preActionIsExecute;
            }

            var ownBet = CachePool.getObj("ownBet") ? CachePool.getObj("ownBet") : 0;
            var minimun = stake - ownBet;
            var maximum = this.gameScreen.users[3].money > 5000 + minimun ? 5000 + minimun : this.gameScreen.users[3].money;
            this.gameScreen.RangeMoneySlider.minimum = minimun;
            this.gameScreen.RangeMoneySlider.snapInterval = 100;
            this.gameScreen.RangeMoneySlider.maximum = maximum;
            this.gameScreen.RangeMoneySlider.value = minimun;
            this.gameScreen.RangeMoneySlider["change"].mask = new egret.Rectangle(0, 30 + this.gameScreen.RangeMoneySlider.height * 0.82, 26, 0);
            this.gameScreen.RangeMoneyBtn.label = "" + minimun;

            for (let i = 0; i < this.gameScreen.count_group.numChildren - 2; i++) {
                let money: eui.Button = <eui.Button>this.gameScreen.count_group.getChildAt(i);
                (parseInt(money.label) >= minimun && parseInt(money.label) <= maximum) ? (money.alpha = 1, money.touchEnabled = true) : (money.alpha = 0.5, money.touchEnabled = false);
            }
            return preActionIsExecute;
        }
    }
}