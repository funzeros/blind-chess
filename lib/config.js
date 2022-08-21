(function (global) {
  function buildChessPieces(list, role) {
    return list.flatMap(([chess, amount], level) =>
      Array.from({ length: amount }, () => ({ name: chess, level, role }))
    );
  }
  register("CHESS_PIECES", {
    red: buildChessPieces(
      [
        ["兵", 5],
        ["炮", 2],
        ["马", 2],
        ["车", 2],
        ["相", 2],
        ["仕", 2],
        ["将", 1],
      ],
      "red"
    ),
    black: buildChessPieces(
      [
        ["卒", 5],
        ["炮", 2],
        ["马", 2],
        ["車", 2],
        ["象", 2],
        ["士", 2],
        ["将", 1],
      ],
      "black"
    ),
  });
  register("DICT", {
    PIECES_STATUS: {
      DISABLED: "disabled",
      ACTIVED: "actived",
      SELECTED: "selected",
    },
    ZH: {
      red: "红方",
      black: "黑方",
    },
  });
})(this);
