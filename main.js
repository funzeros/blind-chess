(function (global) {
  AppDom.$define(
    class AppMain extends AppDom {
      assets = [
        "./lib/util.js",
        "./lib/config.js",
        "./view/chess_home.js",
        "./view/chess_cover.js",
        "./view/chess_board.js",
        "./view/chess_pieces.js",
      ];
      loadedAssetsCount = 0;
      async render() {
        this.oLoading = section(null, { class: "loading" });
        this.oLoadingText = div("正在加载资源...");
        this.oLoading.appendChild(this.oLoadingText);
        this.oLoading.appendChild(
          div('<div class="loading-progress_inner"></div>', {
            class: "loading-progress",
          })
        );
        this.$appendChild(this.oLoading);

        this.oStyle = style();
        this.$appendChild(this.oStyle);
        this.oStyle.textContent = `
        .loading{
          height:100vh;
          font-weight:900;
          font-size:24px;
          display:flex;
          flex-direction:column;
          justify-content:center;
          align-items:center;
        }
        .loading-progress{
          margin-top:20px;
          width:60vw;
          height:20px;
          border:4px solid #000;
          border-radius:8px;
          position:relative;
          overflow:hidden;
        }
        .loading-progress_inner{
          width:100%;
          height:100%;
          background: linear-gradient(-45deg, #0278ee 36%, #7db9e8 28%, #7db9e8 67%, #0278ee 25%);
          background-size: 40px 20px;
          will-change:transform;
          transition:transform 300ms ease-out;
          transform:translateX(-100%);
        }
        `;
        await this.loadingAssets();

        if (this.loadedAssetsCount === this.assets.length) {
          await sleep(500);
          this.$removeChild(this.oStyle);
          this.$removeChild(this.oLoading);
          this.oChessHome = ChessHome();
          this.$appendChild(this.oChessHome);
          return;
        }
        this.oLoading.innerText = "资源加载出错了，请重试！";
      }

      changeOLoading() {
        this.oLoadingText.innerText = `正在加载资源...${this.loadedAssetsCount}/${this.assets.length}`;
        this.shadow.querySelector(
          ".loading-progress_inner"
        ).style.transform = `translateX(${
          Math.floor((this.loadedAssetsCount * 100) / this.assets.length) - 100
        }%)`;
      }
      async loadingAssets() {
        this.changeOLoading();
        return await Promise.all(
          this.assets.map(async (path) => {
            const res = await syncImport(path);
            if (res) {
              ++this.loadedAssetsCount;
              this.changeOLoading();
            }
            return res;
          })
        );
      }
    }
  );
})(this);
