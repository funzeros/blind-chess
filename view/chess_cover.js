(function (global) {
  AppDom.$define(
    class ChessCover extends AppDom {
      hidden() {
        this.style.display = "none";
      }
      show() {
        this.oTips.innerText = "";
        this.style.display = "block";
      }
      async render() {
        this.oPeerId = div(
          `<div>${this.peerId}</div><div class="tip">${
            navigator.clipboard ? "点击复制游戏id" : "游戏id"
          }</div>`,
          {
            class: "peer-id",
            title: "点击复制",
          }
        );
        this.$appendChild(this.oPeerId);
        if (navigator.clipboard) {
          this.oPeerId.addEventListener("click", async () => {
            navigator.clipboard.writeText(this.peerId);
            this.oPeerId.querySelector(".tip").innerText =
              "已复制到剪贴板，快去邀请对战吧！";
            await sleep(3000);
            this.oPeerId.querySelector(".tip").innerText = "点击复制游戏id";
          });
        }
        this.oPeerIdStyle = style();
        this.$appendChild(this.oPeerIdStyle);
        this.oPeerIdStyle.textContent = `
        .peer-id{
            background-color:#f6f6f6;
            padding:10px;
            border:1px solid #000;
            cursor:pointer;
            text-align:center;
        }
        .peer-id .tip{
            font-size:12px;
            color:#999;
        }
        `;

        this.oEnter = section(
          `
        <label for="peer-id__input">对方id</label>
        <input id="peer-id__input"/>
        <button class="button-invite">邀请对战</button>
        `,
          { class: "enter" }
        );
        this.$appendChild(this.oEnter);
        this.oTips = div();
        this.$appendChild(this.oTips);
        this.oInput = this.oEnter.querySelector("#peer-id__input");
        this.oButtonInvite = this.oEnter;
        this.oButtonInvite
          .querySelector(".button-invite")
          .addEventListener("click", () => {
            if (this.peerConn) {
              this.oTips.innerText = "上一个连接未结束...稍等";
              return;
            }
            const { value = "" } = this.oInput;
            if (value) {
              if (value === this.peerId) {
                this.oInput.value = "";
                alert("请不要输入自己的id");
                return;
              }
              this.$store.passivity = false;
              this.setPeerConn(this.peer.connect(value), true);
              this.oTips.innerText = "正在连接...";
            }
          });
        this.peer.on("error", (error) => {
          this.peerConn = null;
          this.oTips.innerText = "连接失败，对方不在线或id错误";
        });
        this.$on("busy", () => {
          this.oTips.innerText = "对方繁忙，请稍后邀请";
        });
        this.$on("open", (i) => {
          this.oTips.innerText = "连接成功";
          if (i) {
            const p = {
              type: "start-game",
              seed: Date.now(),
            };
            this.send(p);
            this.$emit("start-game", p, true);
          }
        });
        this.oEnterStyle = style();
        this.$appendChild(this.oEnterStyle);
        this.oEnterStyle.textContent = `
        .enter{
            margin-top:40px;
            display:flex;
            align-items:center;
            justify-content:center;
        }
        .enter label{
            font-size:24px;
        }
        .enter input{
            width:300px;
            font-size:20px;
            outline:none;
            height:40px;
            line-height:40px;
            margin:0 10px
        }
        .enter button{
            height:46px;
            line-height:46px;
            padding:0 10px;
            font-size:24px;
        }
        `;
      }
    }
  );
})();
