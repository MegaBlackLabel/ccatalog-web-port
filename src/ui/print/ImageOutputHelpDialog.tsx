import type { CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';
import { DIALOG_LIFT_STYLE } from '../dialog-layer';

export type ImageOutputHelpDialogProps = {
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/**
 * 画像ファイル出力の「説明」ボタン (ダイアログ 197 の 1646) が開く説明ダイアログ。
 * 中身は元実装のヘルプ (CHM 4PRINT/6BMP.HTM「BMPファイル出力」) と同じ説明。
 * 元実装はヘルプファイルを開くため、Web 版は同じ文面をダイアログに出す。
 */
const SECTIONS: readonly { title: string; body: string }[] = [
  {
    title: 'BMPファイル出力',
    body: '印刷結果をBMP形式のファイルとして出力します。実行時には以下のようなダイアログが表示されますので、各パラメータを設定してください。',
  },
  {
    title: '出力パス',
    body: 'BMPファイルを出力するフォルダを指定します。「参照」ボタンで、フォルダ選択ダイアログから選択することもできます。',
  },
  {
    title: '出力ファイル名',
    body: '出力するBMPファイルのベースファイル名を指定します。実際の出力ファイルは「(指定したファイル名)(ページ番号).BMP」の形式になります。',
  },
  {
    title: '長辺のサイズ',
    body: '出力するBMPファイルのサイズを、長辺のピクセル数（ドット数）で指定します。',
  },
  {
    title: '出力範囲',
    body: '出力を行いたい範囲を、「すべて」「ページ指定」から選択します。「ページ指定」の場合は、エディットボックスに出力したいページ番号をコンマ区切りで入力してください。「2-5」（2ページ目から5ページ目まで）や「3-」（3ページ目から最後まで）、「-5」（最初から5ページ目まで）のような形で範囲で指定することや、これらをコンマ区切りで複数指定することもできます。',
  },
  {
    title: '出力形式',
    body: '出力の形式を「サークルリスト印刷」「サークルカット印刷」「マップ印刷」「白地図印刷」の各タイプから選択します。各形式の詳細に関しては、各印刷形式の説明ページを参照してください。',
  },
  {
    title: 'GDI+を使用しないで印刷',
    body: '印刷する際に GDI+ を使わず、ビットマップ生成してから印刷します。うまく印刷ができない場合にこれをチェックすると印刷できる場合があります。ただし、解像度の上限は600dpiとなります。高解像度印刷をする場合は、BMPファイル出力パネルの「高解像度印刷」をチェックしてください。',
  },
  {
    title: '高解像度で出力',
    body: '印刷データを600dpiで生成します。高解像度地図データがある場合は、それを使用します。また、小さな文字などの印刷が綺麗になります。この機能をONにするには、メインメモリ256メガバイト以上が必要です。',
  },
];

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 8,
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
  fontSize: 12,
  background: '#ffffff',
};

const TITLE_STYLE: CSSProperties = {
  fontWeight: 700,
  color: '#000080',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: 6,
  flex: '0 0 auto',
};

export function ImageOutputHelpDialog({
  onClose,
  initialX = 240,
  initialY = 20,
  // 元実装の説明ダイアログの実寸 (ユーザー提供のスクリーンショット 585 x 864)。
  width = 585,
  height = 864,
  zIndex,
}: ImageOutputHelpDialogProps) {
  return (
    <div style={DIALOG_LIFT_STYLE}>
      <Window
        data-testid="image-output-help-dialog"
        title="説明"
        modal
        onClose={onClose}
        width={width}
        height={height}
        initialX={initialX}
        initialY={initialY}
        zIndex={zIndex}
      >
      <div data-testid="image-output-help-body" style={BODY_STYLE}>
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div style={TITLE_STYLE}>{section.title}</div>
            <div>{section.body}</div>
          </div>
        ))}
      </div>
      <div style={BUTTON_ROW_STYLE}>
        <Button variant="default" data-testid="image-output-help-close" onClick={onClose}>
          閉じる(&C)
        </Button>
      </div>
      </Window>
    </div>
  );
}
