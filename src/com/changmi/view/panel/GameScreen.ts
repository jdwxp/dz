
module game {

    export class GameScreen extends eui.Component {

        public backBtn: eui.Button;
        public switchBtn: eui.Button;
        public first_Bet: egret.tween.TweenGroup;

        public giveUpBtn: eui.Button;
        public passBtn: eui.Button;
        public addChipBtn: eui.Button;

        public count_choose: egret.tween.TweenGroup;
        public three_choose: egret.tween.TweenGroup;
        public checkBox_giveUp: eui.CheckBox;
        public checkBox_autoPass: eui.CheckBox;
        public checkBox_followAny: eui.CheckBox;
        public RangeMoneySlider: eui.VSlider;
        public RangeMoneyBtn: eui.Button;

        public users: Array<User>;
        public chips: Array<Chip>;

        public publicCardsGroup: eui.Group;
        public userCardsGroup: eui.Group;
        public UserGroup: eui.Group;

        public MoneyBtnSmallest: eui.Button;
        public MoneyBtnSmall: eui.Button;
        public MoneyBtnNormal: eui.Button;
        public MoneyBtnBig: eui.Button;
        public MoneyBtnBiggest: eui.Button;
        public count_group: eui.Group;


        public multipleBtn1: eui.Button;
        public multipleBtn2: eui.Button;
        public multipleBtn3: eui.Button;


        public constructor() {
            super();
            this.addEventListener(egret.Event.ADDED_TO_STAGE, this.createCompleteEvent, this);
            this.once(egret.Event.ADDED_TO_STAGE, this.initialize, this)
            // this.addEventListener(egret.Event.ADDED_TO_STAGE, this.beginAnimation, this);
        }
        private initialize() {
            ApplicationFacade.getInstance().registerMediator(new GameMediator(this));
        }

        private sendCardToUserTimer: egret.Timer;
        public beginAnimation() {
            var index = -1;
            var userCount = UserUtils.getInstance().getUsers().length;
            this.sendCardToUserTimer = new egret.Timer(300, 2 * userCount);
            this.sendCardToUserTimer.addEventListener(egret.TimerEvent.TIMER, sendCardToUserTimer, this);
            this.sendCardToUserTimer.addEventListener(egret.TimerEvent.TIMER_COMPLETE, sendCardToUserTimerOver, this);
            this.sendCardToUserTimer.start();

            function sendCardToUserTimer() {
                index++;
                if (index == this.sendCardToUserTimer.repeatCount) {
                    return;
                }
                if (UserUtils.getInstance().getUserFromIndex(index % userCount).seat == 3) {
                    this.sendOwnCard(index / userCount, UserUtils.getInstance().getOwnUser().cards.cards[parseInt("" + index / userCount)]);
                    return;
                }
                var userSeat: number = UserUtils.getInstance().getUserFromIndex(index % userCount).seat;
                var x: number = this.users[userSeat].x + 102 + 104; //一个是group的位置偏移，一个是user位置偏移
                var y: number = this.users[userSeat].y + 47 + 64;
                if (this.users[userSeat].visible) {  //如果这个位置有人
                    this.cardAnimationWithOrigin(x, y, this.sendCardFinish, [userSeat]);
                }
            }

            function sendCardToUserTimerOver() {
                //游戏开始
                //this.sendPublicCard(1, CardUtils.getInstance().getPublicCards);
            }
        }

        public sendCardFinish(index: number, card: eui.Image) {
            this.removeChild(card);
            this.users[index].cardNum++;
        }

        //刷新页面
        public createCompleteEvent() {
            this.skinName = "skins.GameSkin";
            this.switchBtn = new eui.Button();
            this.switchBtn.label = "切换你";
            this.switchBtn.left = 0;
            this.switchBtn.verticalCenter = 0;
            this.addChild(this.switchBtn);

            //测试用
            this.users = [this["User_1"], this["User_2"], this["User_3"], this["User_4"], this["User_5"], this["User_6"], this["User_7"]];
            this.chips = [this["Chip_1"], this["Chip_2"], this["Chip_3"], this["Chip_4"], this["Chip_5"], this["Chip_6"], this["Chip_7"]];
            var userpool: Array<User> = UserUtils.getInstance().getUsers();
            var readyId: string = CachePool.getObj("ready");
            for (var i = 0; i < userpool.length; i++) {
                var user: User = userpool[i];
                user.cardNum = 0;
                this.addOneUserAction(user);
                if (user.uId == readyId) {
                    this.users[user.seat].startrotate(CachePool.getObj("time"));
                }
            }
            for (var i = 0; i < CardUtils.getInstance().getPublicCards().length; i++) {
                let card: Card = <Card>this.publicCardsGroup.getChildAt(i);
                card.createCardSource(CardUtils.getInstance().getPublicCard(i).index, CardUtils.getInstance().getPublicCard(i).color)
                card.visible = true;
            }
            // let card1: Card = new Card(5, 2);
            // let card2: Card = new Card(5, 3);
            // let cardGroup: Array<Card> = [];
            // cardGroup.push(card1);
            // cardGroup.push(card2);
            // this.showPlayerCards("10089", cardGroup);
            this["baseChipNum"].text = CachePool.getObj("jackpot");
            this.RangeMoneySlider["change"].mask = new egret.Rectangle(0, 0, 0, 0);
            this.RangeMoneySlider.addEventListener(egret.Event.CHANGE, this.onVSLiderChange, this);

            // this.sendPublicCard(1, CardUtils.getInstance().getPublicCards());
        }

        public sendCard(card: Card, card1: eui.Image) {
            this.removeChild(card1);
            card.visible = true;
            card.startrotateAndChangeSource();
        }

        /**
         * 增加单人方法
         */
        public addOneUserAction(user: User) {
            var index = user.seat;
            this.users[index].name = user.name;
            this.users[index].money = user.money;
            this.users[index].cardNum = 0;
            this.users[index].angle = 1000;
            this.users[index].visible = true;
            this.chips[index].chipNum = user.stake;
            this.chips[index].isRight = (index == 0 || index == 1 || index == 2);
            this.users[index].isCardVisible = (index == 3);
        }

        /**
         * 删除单人方法
         */
        public removeOneUserAction(index: number) {
            if (index){
                this.users[index].visible = false;
            }
        }

        /**
         * 发公共牌，有三个回合，第一回合发三张，后面两回合每次发一张
         */
        public sendPublicCard(round: number) {
            var cards = CardUtils.getInstance().getPublicCards();
            switch (round) {
                case 1: {
                    for (var i = 0; i < 3; i++) {
                        let card = (<Card>this.publicCardsGroup.getChildAt(i));
                        card.index = cards[i].index;
                        card.color = cards[i].color;
                        egret.setTimeout(function (card: Card) {
                            this.cardAnimationWithOrigin(this.publicCardsGroup.x + card.x, this.publicCardsGroup.y + card.y, this.sendCard, [card]);
                        }, this, i * 300, card);
                    }
                    break;
                }
                case 2:
                case 3: {
                    var index = round + 1;
                    let card = (<Card>this.publicCardsGroup.getChildAt(index));
                    card.index = cards[index].index;
                    card.color = cards[index].color;
                    this.cardAnimationWithOrigin(this.publicCardsGroup.x + card.x, this.publicCardsGroup.y + card.y, this.sendCard, [card]);
                    break;
                }

            }

        }
        public hidePublicCard() {
            for (let i = 0; i < this.publicCardsGroup.numChildren; i++) {
                this.publicCardsGroup.getChildAt(i).visible = false;
                (<Card>this.publicCardsGroup.getChildAt(i)).source = "poker_bg_png";
            }
            CardUtils.getInstance().clearPublicCards();
        }
        /**
         * 发玩家的手牌
         */
        public sendOwnCard(index: number, data: Card) {
            let card = (<Card>this.userCardsGroup.getChildAt(index));
            card.index = data.index;
            card.color = data.color;
            this.cardAnimationWithOrigin(this.userCardsGroup.x + card.x, this.userCardsGroup.y + card.y, this.sendCard, [card]);
        }
        /**
         * 隐藏玩家手牌
         */
        public hideOwnCards() {
            this.userCardsGroup.getChildAt(0).visible = false;
            this.userCardsGroup.getChildAt(1).visible = false;
            (<Card>this.userCardsGroup.getChildAt(0)).source = "poker_bg_png";
            (<Card>this.userCardsGroup.getChildAt(1)).source = "poker_bg_png";
        }

        /**
         * 隐藏所有玩家和筹码
         */
        public hideAllUserAndChip(){
            for(var i = 0;i < 7;i++){
                this.users[i].visible = false;
                this.chips[i].chipNum = 0;
            }
        }
        /**
         * 重置游戏最后开出底牌的人信息
         * 1.隐藏手牌
         * 2.隐藏牌型信息
         */
        public hideOtherCardsAndResetName() {
            for (let i = 0; i < this.users.length; i++) {
                this.users[i].hidePlayerCardGroup();
                this.users[i].resetPlayerOut();
            }
        }

        /**
         * 显示手牌
         */
        public showPlayerCards(uid: string, cardGroup: Array<Card>) {
            let user: User = UserUtils.getInstance().getUserFromUid(uid);
            this.users[user.seat].playerCardGroup.visible = true;
            for (let i = 0; i < this.users[user.seat].playerCardGroup.numChildren; i++) {
                let card: Card = <Card>this.users[user.seat].playerCardGroup.getChildAt(i);
                card.createCardSource(cardGroup[i].index, cardGroup[i].color);
            }
        }

        public switchBottomState(state: String) {
            if (state == "first_Bet") {
                this.first_Bet.play(0);
            }
            if (state == "count_choose") {
                this.count_choose.play(0);
            }
            if (state == "three_choose"&&this.skin.currentState!="three_choose") {
                this.three_choose.play(0);
            }
            this.skin.currentState = state + "";
        }

        private onVSLiderChange(e: egret.Event) {
            var scale = (this.RangeMoneySlider.pendingValue - this.RangeMoneySlider.minimum) / (this.RangeMoneySlider.maximum - this.RangeMoneySlider.minimum);
            this.RangeMoneySlider["change"].mask = new egret.Rectangle(0,
                30 + (1 - scale) * this.RangeMoneySlider.height * 0.82,
                26,
                scale * this.RangeMoneySlider.height * 0.82);
            this.RangeMoneyBtn.label = "" + this.RangeMoneySlider.pendingValue;
        }

        //下面都是动画效果

        //收钱动画
        public sendMoneyAnimation() {
            for (var i = 0; i < 7; i++) {
                if (this.chips[i].chipNum != 0) {
                    this.chips[i].gotoBaseAnimation(this["baseChipNum"]);
                }
            }
        }

        //通用发牌效果
        public cardAnimationWithOrigin(x: number, y: number, finishAnimationFunction: Function, params?: any[]) {
            var card: eui.Image = new eui.Image();
            card.texture = RES.getRes("gamescreen.poker_right");
            card.x = 652;
            card.y = 187;
            this.addChild(card);
            var tween: egret.Tween = egret.Tween.get(card);
            tween.to({ x: x, y: y, scale: 0.5, alpha: 0.5 }, 300, egret.Ease.sineOut);
            params.push(card);
            tween.call(finishAnimationFunction, this, params);
        }
        /**
         * 停止上一个用户的转圈，开始下一个转圈
         */
        public changePlayer(uid: string, nextUid: string) {
            if (uid != "") {
                this.users[UserUtils.getInstance().getUserFromUid(uid).seat].stoprotate();
            }
            if (nextUid != "") {
                let nextUser = UserUtils.getInstance().getUserFromUid(nextUid);
                this.users[nextUser.seat].startrotate(30);
            }
        }
        /**
         * 用户弃牌
         */
        public playerFold(uid: string, raiseStack: number) {
            if (raiseStack == 0) {
                this.users[UserUtils.getInstance().getUserFromUid(uid).seat].playerOut();
            }
        }

        //通用加注效果
        public addChipAnimation(chip: number, userPosition: number) {
            if (chip == 0) {
                return;
            }
            var chipImg: eui.Image = new eui.Image();
            chipImg.x = this.users[userPosition].x + 50;
            chipImg.y = this.users[userPosition].y + 140;
            this.UserGroup.addChild(chipImg);

            if (chip <= 300) {
                chipImg.texture = RES.getRes("gamescreen.chip_50-300");
            } else if (chip <= 1000) {
                chipImg.texture = RES.getRes("gamescreen.chip_300-1000");
            } else if (chip <= 2500) {
                chipImg.texture = RES.getRes("gamescreen.chip_1000-2500");
            } else if (chip <= 5000) {
                chipImg.texture = RES.getRes("gamescreen.chip_2500-5000");
            } else {
                chipImg.texture = RES.getRes("gamescreen.chip_5000_more");
            }

            this.users[userPosition].money -= chip;
            var tween: egret.Tween = egret.Tween.get(chipImg);
            tween.to({ x: this.chips[userPosition].x + 40, y: this.chips[userPosition].y, scale: 0.5, alpha: 0.5 }, 400, egret.Ease.sineOut);
            tween.call(function () {
                this.chips[userPosition].chipNum += chip;
                this.UserGroup.removeChild(chipImg);
            }, this);

        }

        //显示高亮公共牌
        public showHeightLightPublicCard(cardArray:Array<number>){
            for (var i = 0;i < 5;i++){
                var card:Card = <Card>this.publicCardsGroup.getChildAt(i);
                if (card.visible){
                    for (var j = 0;j < cardArray.length;j++){
                        var isSame:boolean = card.isSameAs(cardArray[j]);
                        card.isHeightLight = isSame;
                        if (isSame){
                            break;
                        }
                    }
                }
            }
        }

        //显示单个用户手牌
        public showUserCards(cardArray:Array<number>,userPosition:number){
            if (userPosition == 3){
                return;
            }
            this.users[userPosition].showPlayerCardGroup(cardArray);
            this.users[userPosition].cardNum = 0;
        }

        //修改用户名字文本为牌型
        public changeUserNameLabelToCardShape(cardShape:string,userPosition:number){
            this.users[userPosition].cardType = cardShape;
        }

        //给钱动画——未完成
        public giveChipAction(chip: number, userPosition: number) {
            var chipNumArray: Array<number> = [10000, 2500, 1000, 300, 50];
            var chipNameArray: Array<string> = ["gamescreen.chip_5000_more", "gamescreen.chip_2500-5000",
                "gamescreen.chip_1000-2500", "gamescreen.chip_300-1000", "gamescreen.chip_50-300"];
            var chipArray: Array<string> = new Array();
            var chipNow: number = 0;         //记录当前计算的筹码
            for (var i = 0; i < chipNumArray.length; i++) {
                while (chipNow + chipNumArray[i] < chip) {
                    chipNow += chipNumArray[i];
                    chipArray.push(chipNameArray[i]);
                }
            }

            var timer = new egret.Timer(100, chipArray.length);
            timer.addEventListener(egret.TimerEvent.TIMER, giveChip, this);
            timer.addEventListener(egret.TimerEvent.TIMER_COMPLETE, timerComplete, this);
            timer.start();

            AnimationUtils.getInstance().changeLabelNumber(this["baseChipNum"], -chip);
            this.users[userPosition].addChip(chip);

            function giveChip() {
                if(timer.currentCount == 0){
                    return;
                }
                this.giveChipAnimation(this.users[userPosition].x, this.users[userPosition].y, chipArray[timer.currentCount - 1]);
            }

            function timerComplete() {
                timer.removeEventListener(egret.TimerEvent.TIMER, giveChip, this);
                timer.removeEventListener(egret.TimerEvent.TIMER_COMPLETE, timerComplete, this);
            }
        }

        public giveChipAnimation(x: number, y: number, type: string) {
            var chipImg: eui.Image = new eui.Image();
            chipImg.texture = RES.getRes(type);
            chipImg.x = this["baseChipNum"].x;
            chipImg.y = this["baseChipNum"].y;
            this.UserGroup.addChild(chipImg);

            var tween: egret.Tween = egret.Tween.get(chipImg);
            tween.to({ x: x + 50, y: y + 140, scale: 0.5, alpha: 0.5 }, 400, egret.Ease.sineOut);
            tween.call(function () {
                this.UserGroup.removeChild(chipImg);
            }, this);
        }
    }
}