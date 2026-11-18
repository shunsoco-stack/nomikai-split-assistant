"use client";

import { createSeed } from "@/lib/seed";
import { useStore } from "./store";
import { Heading } from "./ui";

export function AboutScreen() {
  const { save, notify } = useStore();
  return (
    <>
      <Heading
        eyebrow="ABOUT KANJI NOTE"
        title="このデモについて"
        description="お会計にも、気持ちのいい区切りを。"
      />
      <section className="panel prose">
        <h2>デモ用の架空データです</h2>
        <p>
          「第二営業部」の飲み会を想定したポートフォリオ作品です。登場する人物・会場・会計・集金記録はすべて架空で、実在の人物や店舗とは関係ありません。
        </p>
        <h2>幹事のための、割り勘の道具</h2>
        <p>
          役職・滞在時間・飲酒の有無から会費を計算し、端数を整えて、集金状況を記録します。経費精算や承認、日当・交通費の精算、送金・決済、お店の予約は行いません。
        </p>
        <h2>データはどこに保存される？</h2>
        <p>
          このブラウザのlocalStorage（キー：nsa:v1）に保存されます。別の端末やブラウザとは同期しません。ブラウザのデータを消すと記録も消えるため、バックアップをご利用ください。共有URLの内容はURL自体に含まれます。
        </p>
        <h2>計算の考え方</h2>
        <p>
          固定額を先に確保し、残額を「役職の重み × 滞在割合 ×
          飲酒係数」で按分します。重み0のゲストには請求せず、他の対象者が負担します。全員が重み0の場合は不足を表示し、会社負担などを別途確認します。コース・飲み放題の有無はメモ項目で、係数は自動変更しません。
        </p>
        <h2>日時とデモデータ</h2>
        <p>
          日本時間を基準に、初回に開いた日から相対的に10件の会を作成します。過去の会8件、集金中の会1件、今後の予定1件です。日付をまたぐ会には対応していません。初回生成後のデータは自動更新せず、そのまま保持します。
        </p>
      </section>
      <section className="panel reset-panel">
        <h2>既定データに戻す</h2>
        <p>
          現在の設定・参加者・集金記録をすべて削除し、現在の日本時間でデモデータを作り直します。
        </p>
        <button
          className="button danger-button"
          onClick={() => {
            if (
              window.confirm("現在のデータをすべて既定の架空データに置き換えます。よろしいですか？")
            ) {
              save(createSeed(new Date()));
              notify("現在の日時に合わせて、既定データを作り直しました。");
            }
          }}
        >
          既定データに戻す
        </button>
      </section>
    </>
  );
}
