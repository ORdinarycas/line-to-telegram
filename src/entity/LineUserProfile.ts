import {Entity, PrimaryColumn, Column, UpdateDateColumn, CreateDateColumn} from "typeorm";

@Entity()
export class LineUserProfile {

    @PrimaryColumn()
    id: string;

    @Column({
        type: "varchar",
        length: 20
    })
    display_name: string;

    @UpdateDateColumn()
    update_date: Date;

    @CreateDateColumn()
    create_date: Date;

    @Column()
    picture_url: string;

    @Column({
        type: "varchar",
        nullable: true,
        length: 500
    })
    status_message: string;

    @Column({
        type: "varchar",
        nullable: true,
        length: 50
    })
    add_source: string;

    @Column({
        type: "varchar",
        nullable: true,
    })
    language: string;
}
