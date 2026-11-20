import type { Metadata } from "next";
import { Heading } from "@/components/ui";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 飲み会の傾斜割り勘・幹事アシスタント",
  description: "広告配信（忍者AdMax）と、このアプリが保存するデータについて。",
};

export default function PrivacyPage() {
  return (
    <>
      <Heading
        eyebrow="PRIVACY"
        title="プライバシーポリシー"
        description="広告配信と、このブラウザに保存するデータについて。"
      />
      <section className="panel prose">
        <h2>広告配信（忍者AdMax）とオプトアウト</h2>
        <p>
          本番環境のトップページ末尾では、忍者ツールズ株式会社が提供する広告配信サービス「忍者AdMax」を利用しています。忍者AdMaxおよびその提携事業者は、広告の配信、効果測定、不正防止などのため、Cookie等の技術を利用して、アクセス日時、閲覧したページのURL、リファラー、IPアドレス、ブラウザ・端末に関する情報などを取得する場合があります。取得された情報は、各事業者のプライバシーポリシー等に従って取り扱われます。
        </p>
        <p>
          Cookie等による情報の取得を望まない場合は、ブラウザの設定でCookieを無効にする、または削除することで拒否（オプトアウト）できます。ただし、一部の機能が正常に利用できなくなる場合があります。オプトアウトの方法と提携事業者については、忍者ツールズの
          <a href="https://corp.ninja.co.jp/privacy/cookie/" target="_blank" rel="noopener noreferrer">
            「Cookie等の技術や広告用IDの利用について」
          </a>
          を、個人情報の取扱いについては
          <a href="https://corp.ninja.co.jp/privacy/" target="_blank" rel="noopener noreferrer">
            忍者ツールズのプライバシーポリシー
          </a>
          をご確認ください。
        </p>
        <h2>このアプリが保存するデータ</h2>
        <p>イベントや割り勘の設定は、このブラウザの localStorage（キー：nsa:v1）に保存されます。広告のために保存済みの会の内容を送信する処理はありません。</p>
      </section>
    </>
  );
}
